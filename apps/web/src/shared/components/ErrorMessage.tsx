type Props = { message: string };

export const ErrorMessage = ({ message }: Props) => (
  <p className="text-sm text-danger">{message}</p>
);
