const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]{8,}$/;

export function validateEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string) {
  return PASSWORD_REGEX.test(password);
}
