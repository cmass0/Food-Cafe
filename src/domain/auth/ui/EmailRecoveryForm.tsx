import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 휴대폰 본인인증과 전화번호 저장 정책이 확정되면 실제 조회 액션을 연결한다.
export default function EmailRecoveryForm() {
  return (
    <fieldset className="grid gap-4" disabled>
      <div className="grid gap-2">
        <Label htmlFor="email-recovery-name">이름</Label>
        <Input id="email-recovery-name" name="name" placeholder="가입할 때 입력한 이름" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email-recovery-phone">휴대폰 번호</Label>
        <Input
          id="email-recovery-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="휴대폰 본인인증 연결 예정"
        />
      </div>
      <Button type="button">본인인증 후 이메일 찾기</Button>
    </fieldset>
  );
}
