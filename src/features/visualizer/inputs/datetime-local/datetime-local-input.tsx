import { useEffect, useMemo, useState } from "react";
import type { InputComponentProps } from "..";
import type { DatetimeLocalInput } from "./types";
import {
  isValidDate,
  parseDatetimeLocalPartsToDate,
  parseDatetimeLocalPartsToISO,
  parseISOToDate,
} from "./util";
import { Input } from "~/components/form/input";

export default function DatetimeLocalInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<DatetimeLocalInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (input.defaultValue) {
      const required = !!input.required;
      const date = parseISOToDate(input.defaultValue);

      if (
        !isValidDate(date) ||
        (!!input.min && date < parseDatetimeLocalPartsToDate(input.min)) ||
        (!!input.max && date > parseDatetimeLocalPartsToDate(input.max))
      ) {
        onChange({
          value: input.defaultValue,
          success: !required,
        });
      } else {
        onChange({
          value: input.defaultValue,
          success: true,
        });
      }
    }
  }, [input.defaultValue]);

  const handleDatetimeLocalOnChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    const required = !!input.required;

    const newDate = parseISOToDate(newValue);
    if (isNaN(newDate.getTime())) {
      setShowError(true);
      setErrorMessage(`Invalid date.`);
      onChange({
        value: "",
        success: !required,
        message: `Invalid date.`,
      });
      return;
    }

    if (!!input.min && newDate < parseDatetimeLocalPartsToDate(input.min)) {
      const min = parseDatetimeLocalPartsToISO(input.min);
      setShowError(true);
      setErrorMessage(`Date must be before ${min}.`);
      onChange({
        value: "",
        success: !required,
        message: `Date must be before ${min}.`,
      });
      return;
    }

    if (!!input.max && newDate > parseDatetimeLocalPartsToDate(input.max)) {
      const max = parseDatetimeLocalPartsToISO(input.max);
      setShowError(true);
      setErrorMessage(`Date must not be after ${max}.`);
      onChange({
        value: "",
        success: !required,
        message: `Date must not be after ${max}.`,
      });
      return;
    }

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator
        ? validator.success
        : !!newValue.trim()
      : true;
    const message = required
      ? validator
        ? validator.message ?? ""
        : "This field is required."
      : "";

    setShowError(!isValid);
    setErrorMessage(message);

    onChange({
      value: newValue,
      success: isValid,
      message: message,
    });
  };

  return (
    <>
      <Input
        id={input.id}
        type="datetime-local"
        value={value ? String(value) : ""}
        onChange={handleDatetimeLocalOnChange}
        min={input.min ? parseDatetimeLocalPartsToISO(input.min) : ""}
        max={input.max ? parseDatetimeLocalPartsToISO(input.max) : ""}
        step={input.step}
        required={input.required}
        placeholder={input.placeholder}
        disabled={input.disabled}
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
