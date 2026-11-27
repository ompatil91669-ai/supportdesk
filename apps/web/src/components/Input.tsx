import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    wrapperClassName = "",
    className = "",
    id,
    "aria-describedby": describedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const classes = ["control-input", "input-control", className]
    .filter(Boolean)
    .join(" ");
  const descriptionIds = [describedBy, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["input-field", wrapperClassName].filter(Boolean).join(" ")}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        {...props}
        ref={ref}
        id={inputId}
        className={classes}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={descriptionIds || undefined}
      />
      {error && (
        <p id={errorId} className="input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
