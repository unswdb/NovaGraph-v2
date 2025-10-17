import { useEffect, useState } from "react";

import {
  parseDatePartsToDate,
  parseDatePartsToISO,
  parseISOToDate,
} from "./util";

import type { InputComponentProps } from "..";
import type { DateInput } from "./types";

import { Input } from "~/components/form/input";

export default function DateInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<DateInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDateOnChange = async (newValue: string) => {
    const required = !!input.required;

    if (!input.validate) {
      return { value: newValue, success: true };
    }

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

    if (!!input.min && newDate < parseDatePartsToDate(input.min)) {
      const min = parseDatePartsToISO(input.min);
      setShowError(true);
      setErrorMessage(`Date must be before ${min}.`);
      onChange({
        value: "",
        success: !required,
        message: `Date must be before ${min}.`,
      });
      return;
    }

    if (!!input.max && newDate > parseDatePartsToDate(input.max)) {
      const max = parseDatePartsToISO(input.max);
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
      ? validator && !!newValue.trim()
        ? validator.success
        : !!newValue.trim()
      : true;
    const message = required
      ? validator && !!newValue.trim()
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

  useEffect(() => {
    if (input.defaultValue) {
      handleDateOnChange(input.defaultValue);
    }
  }, [input.defaultValue]);

  return (
    <>
      <Input
        id={input.id}
        type="date"
        value={value ? String(value) : ""}
        onChange={(e) => handleDateOnChange(e.target.value)}
        min={input.min ? parseDatePartsToISO(input.min) : ""}
        max={input.max ? parseDatePartsToISO(input.max) : ""}
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
