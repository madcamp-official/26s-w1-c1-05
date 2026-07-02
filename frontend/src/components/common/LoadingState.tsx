type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = '불러오는 중입니다.' }: LoadingStateProps) {
  return (
    <div className="state-block" role="status">
      {label}
    </div>
  );
}
