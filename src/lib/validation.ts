/**
 * 校验新密码和确认密码是否满足规则。
 * 返回 null 表示验证通过，否则返回中文错误信息。
 */
export function validatePasswordPair(password: string, confirmPassword: string): string | null {
  if (!password.trim()) {
    return "请输入新密码。";
  }

  if (password.trim().length < 8) {
    return "新密码至少需要 8 位。";
  }

  if (password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }

  return null;
}
