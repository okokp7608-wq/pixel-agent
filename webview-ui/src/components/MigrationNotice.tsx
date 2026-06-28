import { Button } from './ui/Button.js';

interface MigrationNoticeProps {
  onDismiss: () => void;
}

export function MigrationNotice({ onDismiss }: MigrationNoticeProps) {
  return (
    <div
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-100"
      onClick={onDismiss}
    >
      <div
        className="pixel-panel py-24 px-32 max-w-xl text-center leading-[1.3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-12 text-accent">사과드립니다!</div>
        <p className="text-xl m-0 mb-12">
          저희는 완전히 오픈 소스 에셋으로 마이그레이션했으며, 모두 처음부터 정성껏 만들었습니다.
          불행히도, 이는 이전 레이아웃을 재설정해야 한다는 의미입니다.
        </p>
        <p className="text-xl m-0 mb-12">정말 죄송합니다.</p>
        <p className="text-xl m-0 mb-12">
          좋은 소식이 있습니다. 이것은 일회성이었고, 정말 흥미로운 업데이트의 길을 열어줍니다.
        </p>
        <p className="text-xl m-0 mb-20">계속 주목해주시고, Pixel Agents를 사용해주셔서 감사합니다!</p>
        <Button variant="accent" size="xl" onClick={onDismiss}>
          확인
        </Button>
      </div>
    </div>
  );
}
