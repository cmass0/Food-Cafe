import PasswordField from "./PasswordField";

type NewPasswordFieldsProps = {
  idPrefix: string;
  disabled?: boolean;
};

export default function NewPasswordFields({ idPrefix, disabled = false }: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordField
        id={`${idPrefix}-new-password`}
        name="newPassword"
        label="새 비밀번호"
        placeholder="새 비밀번호 입력"
        autoComplete="new-password"
        minLength={6}
        disabled={disabled}
      />
      <PasswordField
        id={`${idPrefix}-confirm-password`}
        name="confirmPassword"
        label="새 비밀번호 확인"
        placeholder="새 비밀번호 다시 입력"
        autoComplete="new-password"
        minLength={6}
        disabled={disabled}
      />
    </>
  );
}
