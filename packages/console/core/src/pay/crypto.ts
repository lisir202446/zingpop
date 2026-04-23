import { createDecipheriv, createSign, createVerify } from "node:crypto"

export function signAlipayPayload(payload: string, privateKey: string) {
  const sign = createSign("RSA-SHA256")
  sign.update(payload, "utf8")
  return sign.sign(privateKey, "base64")
}

export function verifyAlipayPayload(payload: string, signature: string, publicKey: string) {
  const verify = createVerify("RSA-SHA256")
  verify.update(payload, "utf8")
  return verify.verify(publicKey, signature, "base64")
}

export function signWechatMessage(message: string, privateKey: string) {
  const sign = createSign("RSA-SHA256")
  sign.update(message, "utf8")
  return sign.sign(privateKey, "base64")
}

export function verifyWechatMessage(message: string, signature: string, publicKey: string) {
  const verify = createVerify("RSA-SHA256")
  verify.update(message, "utf8")
  return verify.verify(publicKey, signature, "base64")
}

export function decryptWechatResource(input: {
  apiV3Key: string
  associatedData: string
  nonce: string
  ciphertext: string
}) {
  const encrypted = Buffer.from(input.ciphertext, "base64")
  const ciphertext = encrypted.subarray(0, -16)
  const authTag = encrypted.subarray(-16)
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(input.apiV3Key, "utf8"), Buffer.from(input.nonce),)
  decipher.setAAD(Buffer.from(input.associatedData))
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
