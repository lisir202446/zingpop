-- ============================================================
-- Zingpop 数据库诊断脚本
-- 用法: mysql -h <HOST> -u <USER> -p <DATABASE> < db-check.sql
-- 或在 Navicat / DBeaver 里逐段执行
--
-- 说明: cost/balance 字段单位是 micro-cents
--       除以 100000000 得到美元，除以 647 再除以 100 得人民币估算
-- ============================================================


-- ============================================================
-- 第一节：用户总量
-- ============================================================

SELECT '===== 一、用户总量 =====' AS '';

-- 1.1 账号总数（每个真实用户一个 account）
SELECT
  COUNT(*)                                           AS 总账号数,
  COUNT(CASE WHEN time_deleted IS NULL THEN 1 END)   AS 有效账号数,
  COUNT(CASE WHEN time_deleted IS NOT NULL THEN 1 END) AS 已删除账号数,
  MIN(time_created)                                  AS 最早注册时间,
  MAX(time_created)                                  AS 最新注册时间
FROM account;

-- 1.2 按登录方式统计（手机号 / GitHub / Google / email）
SELECT
  provider                           AS 登录方式,
  COUNT(*)                           AS 账号数
FROM auth
WHERE time_deleted IS NULL
GROUP BY provider
ORDER BY 账号数 DESC;

-- 1.3 工作区总数
SELECT
  COUNT(*)                                           AS 总工作区数,
  COUNT(CASE WHEN time_deleted IS NULL THEN 1 END)   AS 有效工作区数,
  MIN(time_created)                                  AS 最早创建时间
FROM workspace;


-- ============================================================
-- 第二节：用户增长趋势（按天）
-- ============================================================

SELECT '===== 二、近 30 天每日新增账号 =====' AS '';

SELECT
  DATE(time_created)   AS 日期,
  COUNT(*)             AS 新增账号数
FROM account
WHERE time_created >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(time_created)
ORDER BY 日期 DESC;


-- ============================================================
-- 第三节：活跃用户
-- ============================================================

SELECT '===== 三、活跃用户分布 =====' AS '';

-- 3.1 今日 / 7日 / 30日 / 90日活跃（以 time_seen 为准）
SELECT
  COUNT(CASE WHEN time_seen >= DATE_SUB(NOW(), INTERVAL 1  DAY)  THEN 1 END) AS 今日活跃,
  COUNT(CASE WHEN time_seen >= DATE_SUB(NOW(), INTERVAL 7  DAY)  THEN 1 END) AS 近7日活跃,
  COUNT(CASE WHEN time_seen >= DATE_SUB(NOW(), INTERVAL 30 DAY)  THEN 1 END) AS 近30日活跃,
  COUNT(CASE WHEN time_seen >= DATE_SUB(NOW(), INTERVAL 90 DAY)  THEN 1 END) AS 近90日活跃,
  COUNT(CASE WHEN time_seen IS NOT NULL THEN 1 END)                           AS 至少登录过一次,
  COUNT(CASE WHEN time_seen IS NULL THEN 1 END)                               AS 注册后从未登录
FROM user
WHERE time_deleted IS NULL;

-- 3.2 近 30 天每日活跃用户（DAU）
SELECT
  DATE(time_seen)  AS 日期,
  COUNT(*)         AS 活跃用户数
FROM user
WHERE time_seen >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND time_deleted IS NULL
GROUP BY DATE(time_seen)
ORDER BY 日期 DESC;


-- ============================================================
-- 第四节：AI 使用情况
-- ============================================================

SELECT '===== 四、AI 使用总量 =====' AS '';

-- 4.1 总体概况
SELECT
  COUNT(*)                                      AS 总请求次数,
  COUNT(DISTINCT workspace_id)                  AS 使用过的工作区数,
  COUNT(DISTINCT session_id)                    AS 总会话数,
  SUM(input_tokens)                             AS 总输入Token,
  SUM(output_tokens)                            AS 总输出Token,
  SUM(reasoning_tokens)                         AS 总推理Token,
  SUM(cache_read_tokens)                        AS 总缓存命中Token,
  ROUND(SUM(cost) / 100000000, 4)               AS 总花费_USD
FROM usage;

-- 4.2 按模型统计（热门排行）
SELECT
  model                                         AS 模型名,
  provider                                      AS 提供商,
  COUNT(*)                                      AS 调用次数,
  SUM(input_tokens)                             AS 输入Token总量,
  SUM(output_tokens)                            AS 输出Token总量,
  ROUND(SUM(cost) / 100000000, 4)               AS 花费_USD
FROM usage
GROUP BY model, provider
ORDER BY 调用次数 DESC
LIMIT 20;

-- 4.3 按计费方式分布（sub=订阅 / lite=轻量版 / byok=自带Key）
SELECT
  JSON_UNQUOTE(JSON_EXTRACT(enrichment, '$.plan')) AS 计费方式,
  COUNT(*)                                          AS 请求次数,
  ROUND(SUM(cost) / 100000000, 4)                   AS 花费_USD
FROM usage
WHERE enrichment IS NOT NULL
GROUP BY 计费方式
ORDER BY 请求次数 DESC;

-- 4.4 近 30 天每日使用量趋势
SELECT
  DATE(time_created)                            AS 日期,
  COUNT(*)                                      AS 请求次数,
  COUNT(DISTINCT workspace_id)                  AS 活跃工作区数,
  SUM(input_tokens)                             AS 输入Token,
  SUM(output_tokens)                            AS 输出Token,
  ROUND(SUM(cost) / 100000000, 4)               AS 花费_USD
FROM usage
WHERE time_created >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(time_created)
ORDER BY 日期 DESC;

-- 4.5 近 12 周每周使用量趋势
SELECT
  YEARWEEK(time_created, 3)                     AS 年周,
  MIN(DATE(time_created))                       AS 周开始日期,
  COUNT(*)                                      AS 请求次数,
  COUNT(DISTINCT workspace_id)                  AS 活跃工作区数,
  ROUND(SUM(cost) / 100000000, 4)               AS 花费_USD
FROM usage
WHERE time_created >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
GROUP BY YEARWEEK(time_created, 3)
ORDER BY 年周 DESC;


-- ============================================================
-- 第五节：订阅与付费情况
-- ============================================================

SELECT '===== 五、订阅状态 =====' AS '';

-- 5.1 当前订阅分布
SELECT
  CASE
    WHEN subscription IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(subscription, '$.status')) = 'subscribed'
      THEN CONCAT('Black-', JSON_UNQUOTE(JSON_EXTRACT(subscription, '$.plan')))
    WHEN lite IS NOT NULL
      THEN 'Lite'
    ELSE '无订阅(按量)'
  END                                            AS 套餐类型,
  COUNT(*)                                       AS 工作区数
FROM billing
GROUP BY 套餐类型
ORDER BY 工作区数 DESC;

-- 5.2 余额分布（有余额的工作区）
SELECT
  COUNT(CASE WHEN balance > 0 THEN 1 END)             AS 有余额工作区数,
  COUNT(CASE WHEN balance <= 0 THEN 1 END)            AS 零余额工作区数,
  ROUND(SUM(balance) / 100000000, 2)                  AS 总余额_USD,
  ROUND(AVG(CASE WHEN balance > 0 THEN balance END) / 100000000, 2) AS 平均余额_USD,
  ROUND(MAX(balance) / 100000000, 2)                  AS 最高余额_USD
FROM billing;


-- ============================================================
-- 第六节：支付流水（微信/支付宝）
-- ============================================================

SELECT '===== 六、国内支付流水 =====' AS '';

-- 6.1 支付汇总
SELECT
  channel                                        AS 支付渠道,
  status                                         AS 状态,
  COUNT(*)                                       AS 笔数,
  ROUND(SUM(paid_amount) / 100000000, 2)         AS 已支付金额_USD
FROM payment
GROUP BY channel, status
ORDER BY channel, status;

-- 6.2 近 30 天每日支付
SELECT
  DATE(time_paid)                                AS 日期,
  channel                                        AS 渠道,
  COUNT(*)                                       AS 支付笔数,
  ROUND(SUM(paid_amount) / 100000000, 2)         AS 金额_USD
FROM payment
WHERE status = 'paid'
  AND time_paid >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(time_paid), channel
ORDER BY 日期 DESC;

-- 6.3 最近 20 笔支付明细
SELECT
  DATE_FORMAT(time_paid, '%Y-%m-%d %H:%i')       AS 支付时间,
  workspace_id                                   AS 工作区ID,
  channel                                        AS 渠道,
  status                                         AS 状态,
  ROUND(paid_amount / 100000000, 2)              AS 金额_USD,
  JSON_UNQUOTE(JSON_EXTRACT(enrichment, '$.type')) AS 类型
FROM payment
ORDER BY time_created DESC
LIMIT 20;


-- ============================================================
-- 第七节：用户行为漏斗
-- ============================================================

SELECT '===== 七、注册→使用漏斗 =====' AS '';

SELECT
  total.总注册账号数,
  seen.登录过至少一次,
  used.发起过AI请求,
  paid.付过费,
  CONCAT(ROUND(seen.登录过至少一次   / total.总注册账号数 * 100, 1), '%') AS 注册到登录转化率,
  CONCAT(ROUND(used.发起过AI请求     / total.总注册账号数 * 100, 1), '%') AS 注册到使用转化率,
  CONCAT(ROUND(paid.付过费           / total.总注册账号数 * 100, 1), '%') AS 注册到付费转化率
FROM
  (SELECT COUNT(*) AS 总注册账号数
   FROM account WHERE time_deleted IS NULL) total,

  (SELECT COUNT(DISTINCT account_id) AS 登录过至少一次
   FROM user WHERE time_seen IS NOT NULL AND time_deleted IS NULL) seen,

  (SELECT COUNT(DISTINCT workspace_id) AS 发起过AI请求
   FROM usage) used,

  (SELECT COUNT(DISTINCT workspace_id) AS 付过费
   FROM payment WHERE status = 'paid') paid;


-- ============================================================
-- 第八节：异常 & 风险检查
-- ============================================================

SELECT '===== 八、异常检查 =====' AS '';

-- 8.1 有异常的续费错误
SELECT
  COUNT(CASE WHEN reload_error IS NOT NULL THEN 1 END)  AS 有自动续费错误的工作区数,
  COUNT(CASE WHEN reload = 1 THEN 1 END)                AS 开启自动续费的工作区数
FROM billing;

-- 8.2 待处理的支付订单（挂起超过1小时）
SELECT
  COUNT(*)                                       AS 超1小时未完成的支付单,
  MIN(time_created)                              AS 最早一笔
FROM payment
WHERE status = 'pending'
  AND time_created < DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- 8.3 近7天登录失败异常（验证码尝试超限）
SELECT
  COUNT(DISTINCT phone)                          AS 触发尝试超限的手机号数,
  COUNT(*)                                       AS 总超限记录数
FROM login_code
WHERE attempt_count >= 5
  AND time_created >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 8.4 余额为负的工作区（欠费）
SELECT
  workspace_id,
  ROUND(balance / 100000000, 2) AS 余额_USD
FROM billing
WHERE balance < 0
ORDER BY balance ASC
LIMIT 10;


-- ============================================================
-- 第九节：Top 用户（最活跃 & 最高消费）
-- ============================================================

SELECT '===== 九、Top 10 活跃工作区 =====' AS '';

-- 9.1 按请求次数排名
SELECT
  u.workspace_id                                 AS 工作区ID,
  w.name                                         AS 工作区名称,
  COUNT(*)                                       AS AI请求次数,
  COUNT(DISTINCT u.session_id)                   AS 会话数,
  ROUND(SUM(u.cost) / 100000000, 4)              AS 总花费_USD,
  MIN(u.time_created)                            AS 首次使用,
  MAX(u.time_created)                            AS 最近使用
FROM usage u
LEFT JOIN workspace w ON u.workspace_id = w.id
GROUP BY u.workspace_id, w.name
ORDER BY AI请求次数 DESC
LIMIT 10;

-- 9.2 按消费金额排名
SELECT
  u.workspace_id                                 AS 工作区ID,
  w.name                                         AS 工作区名称,
  COUNT(*)                                       AS AI请求次数,
  ROUND(SUM(u.cost) / 100000000, 4)              AS 总花费_USD
FROM usage u
LEFT JOIN workspace w ON u.workspace_id = w.id
GROUP BY u.workspace_id, w.name
ORDER BY 总花费_USD DESC
LIMIT 10;
