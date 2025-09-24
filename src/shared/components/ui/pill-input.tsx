"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/ui-utils";
import { Button } from "./button";

type PillValidator = (value: string, current: Array<string>) => boolean;

type PillInputContextValue = {
  pills: Array<string>;
  setPills: (next: Array<string>) => void;
  inputValue: string;
  setInputValue: (next: string) => void;
  addPills: (values: Array<string>) => void;
  addPill: (value: string) => void;
  removePillAt: (index: number) => void;
  clearPills: () => void;
  disabled?: boolean;
  maxPills?: number;
  separatorKeys: Array<string>;
  splitOnPaste: boolean;
};

const PillInputContext = React.createContext<PillInputContextValue | null>(
  null,
);

function usePillInputContext() {
  const ctx = React.useContext(PillInputContext);
  if (!ctx) {
    throw new Error(
      "PillInput compound components must be used within <PillInput.Root>",
    );
  }
  return ctx;
}

type RootProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: Array<string>;
  defaultValue?: Array<string>;
  onValueChange?: (next: Array<string>) => void;
  separatorKeys?: Array<string>;
  splitOnPaste?: boolean;
  allowDuplicates?: boolean;
  validator?: PillValidator;
  maxPills?: number;
  disabled?: boolean;
};

const DEFAULT_SEPARATORS: Array<string> = ["Enter", ","];

const Root = React.forwardRef<HTMLDivElement, RootProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onValueChange,
      separatorKeys = DEFAULT_SEPARATORS,
      splitOnPaste = true,
      allowDuplicates = false,
      validator,
      maxPills,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [uncontrolledPills, setUncontrolledPills] = React.useState<
      Array<string>
    >(defaultValue ?? []);
    const pills = React.useMemo(
      () => (isControlled ? (value ?? []) : uncontrolledPills),
      [isControlled, value, uncontrolledPills],
    );
    const setPills = React.useCallback(
      (next: Array<string>) => {
        if (disabled) return;
        if (!isControlled) setUncontrolledPills(next);
        onValueChange?.(next);
      },
      [disabled, isControlled, onValueChange],
    );

    const [inputValue, setInputValue] = React.useState<string>("");

    const canAdd = React.useCallback(
      (candidate: string) => {
        const trimmed = candidate.trim();
        if (!trimmed) return false;
        if (
          !allowDuplicates &&
          pills.some((p) => p.toLowerCase() === trimmed.toLowerCase())
        )
          return false;
        if (typeof maxPills === "number" && pills.length >= maxPills)
          return false;
        if (validator && !validator(trimmed, pills)) return false;
        return true;
      },
      [allowDuplicates, maxPills, pills, validator],
    );

    const addPill = React.useCallback(
      (raw: string) => {
        const trimmed = raw.trim();
        if (!canAdd(trimmed)) return;
        setPills([...pills, trimmed]);
      },
      [canAdd, pills, setPills],
    );

    const addPills = React.useCallback(
      (values: Array<string>) => {
        if (!values.length) return;
        const toAdd: Array<string> = [];
        for (const v of values) {
          const t = v.trim();
          if (!t) continue;
          if (!canAdd(t)) continue;
          toAdd.push(t);
          if (
            typeof maxPills === "number" &&
            pills.length + toAdd.length >= maxPills
          )
            break;
        }
        if (toAdd.length) setPills([...pills, ...toAdd]);
      },
      [canAdd, maxPills, pills, setPills],
    );

    const removePillAt = React.useCallback(
      (index: number) => {
        if (index < 0 || index >= pills.length) return;
        const next = pills.slice(0, index).concat(pills.slice(index + 1));
        setPills(next);
      },
      [pills, setPills],
    );

    const clearPills = React.useCallback(() => {
      if (!pills.length) return;
      setPills([]);
    }, [pills, setPills]);

    const onContainerClick = React.useCallback<
      React.MouseEventHandler<HTMLDivElement>
    >((e) => {
      // Focus the input when clicking the container
      const target = e.currentTarget.querySelector<HTMLInputElement>(
        "input[data-pill-input]",
      );
      target?.focus();
    }, []);

    const ctx: PillInputContextValue = React.useMemo(
      () => ({
        pills,
        setPills,
        inputValue,
        setInputValue,
        addPills,
        addPill,
        removePillAt,
        clearPills,
        disabled,
        maxPills,
        separatorKeys,
        splitOnPaste,
      }),
      [
        pills,
        setPills,
        inputValue,
        addPills,
        addPill,
        removePillAt,
        clearPills,
        disabled,
        maxPills,
        separatorKeys,
        splitOnPaste,
      ],
    );

    return (
      <PillInputContext.Provider value={ctx}>
        <div
          ref={ref}
          data-slot="pill-input"
          data-disabled={disabled ? "true" : undefined}
          className={cn(
            "border-input focus-within:border-ring focus-within:ring-ring/50 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-9 w-full min-w-0 flex-wrap items-center gap-1 rounded-md border bg-transparent px-1.5 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] focus-within:ring-[3px] md:text-sm",
            disabled && "pointer-events-none opacity-60",
            className,
          )}
          onClick={onContainerClick}
          {...props}
        >
          {children}
        </div>
      </PillInputContext.Provider>
    );
  },
);
Root.displayName = "PillInput.Root";

type InputProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "value" | "onChange"
> & {
  placeholder?: string;
  separatorKeys?: Array<string>;
  splitOnPaste?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      placeholder,
      separatorKeys,
      splitOnPaste,
      onKeyDown,
      onPaste,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const {
      inputValue,
      setInputValue,
      addPill,
      addPills,
      pills,
      removePillAt,
      disabled,
      separatorKeys: ctxSeparatorKeys,
      splitOnPaste: ctxSplitOnPaste,
    } = usePillInputContext();

    const resolvedSeparators = separatorKeys ?? ctxSeparatorKeys;
    const resolvedSplitOnPaste = splitOnPaste ?? ctxSplitOnPaste;

    const handleKeyDown = React.useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
      (e) => {
        if (disabled) return;
        if (resolvedSeparators.includes(e.key)) {
          e.preventDefault();
          if (inputValue.trim()) {
            addPill(inputValue);
            setInputValue("");
          }
          return;
        }
        if (
          e.key === "Backspace" &&
          inputValue.length === 0 &&
          pills.length > 0
        ) {
          removePillAt(pills.length - 1);
          return;
        }
        onKeyDown?.(e);
      },
      [
        addPill,
        disabled,
        inputValue,
        onKeyDown,
        pills.length,
        removePillAt,
        resolvedSeparators,
        setInputValue,
      ],
    );

    const handlePaste = React.useCallback<
      React.ClipboardEventHandler<HTMLInputElement>
    >(
      (e) => {
        if (!resolvedSplitOnPaste || disabled) return onPaste?.(e);
        const text = e.clipboardData.getData("text");
        if (!text) return onPaste?.(e);
        const parts = text
          .split(/[\n,;\s]/g)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          e.preventDefault();
          addPills(parts);
        }
        onPaste?.(e);
      },
      [addPills, disabled, onPaste, resolvedSplitOnPaste],
    );

    const handleBlur = React.useCallback<
      React.FocusEventHandler<HTMLInputElement>
    >(
      (e) => {
        if (!disabled) {
          const trimmed = inputValue.trim();
          if (trimmed) {
            addPill(trimmed);
            setInputValue("");
          }
        }
        onBlur?.(e);
      },
      [addPill, disabled, inputValue, onBlur, setInputValue],
    );

    return (
      <input
        ref={ref}
        data-pill-input
        placeholder={pills.length === 0 ? placeholder : undefined}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-transparent px-1 py-1 text-base outline-none md:text-sm",
          "min-w-[8ch] flex-1",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "PillInput.Input";

type PillListProps = React.ComponentPropsWithoutRef<"div"> & {
  renderPill?: (
    pill: string,
    index: number,
    remove: () => void,
  ) => React.ReactNode;
};

const PillList = React.forwardRef<HTMLDivElement, PillListProps>(
  ({ className, renderPill, children, ...props }, ref) => {
    const { pills, removePillAt } = usePillInputContext();
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap items-center gap-1", className)}
        {...props}
      >
        {children}
        {pills.map((pill, index) =>
          renderPill ? (
            <React.Fragment key={`${pill}-${index}`}>
              {renderPill(pill, index, () => removePillAt(index))}
            </React.Fragment>
          ) : (
            <DefaultPill key={`${pill}-${index}`} index={index} label={pill} />
          ),
        )}
      </div>
    );
  },
);
PillList.displayName = "PillInput.List";

type DefaultPillProps = {
  index: number;
  label: string;
};

function DefaultPill({ index, label }: DefaultPillProps) {
  const { removePillAt, disabled } = usePillInputContext();
  return (
    <span
      className={
        "inline-flex select-none items-center gap-2 rounded border-1 bg-accent px-2 py-0.5 text-xs text-accent-foreground"
      }
      title={label}
    >
      <span className="break-all">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removePillAt(index)}
        className={cn(
          "outline-none transition-opacity hover:opacity-80 focus-visible:ring-ring/50 focus-visible:ring-[3px] rounded h-fit w-fit",
          disabled && "pointer-events-none opacity-60",
        )}
        aria-label={`Remove ${label}`}
        disabled={disabled}
      >
        <X className="size-3" />
      </Button>
    </span>
  );
}

type ClearButtonProps = React.ComponentPropsWithoutRef<"button">;

const ClearButton = React.forwardRef<HTMLButtonElement, ClearButtonProps>(
  ({ className, children, ...props }, ref) => {
    const { clearPills, pills, disabled } = usePillInputContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={clearPills}
        disabled={disabled || pills.length === 0}
        className={cn(
          "text-muted-foreground hover:text-foreground outline-none transition-colors disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children ?? "Clear"}
      </button>
    );
  },
);
ClearButton.displayName = "PillInput.Clear";

type PillInputProps = Omit<RootProps, "children"> & {
  placeholder?: string;
  renderPill?: PillListProps["renderPill"];
  inputProps?: Omit<InputProps, "placeholder"> & { placeholder?: string };
  children?: React.ReactNode;
};

function PillInput({
  className,
  placeholder,
  renderPill,
  inputProps,
  children,
  ...rootProps
}: PillInputProps) {
  return (
    <Root className={className} {...rootProps}>
      {/* Default layout: list then input */}
      <PillList renderPill={renderPill} />
      <Input placeholder={placeholder} {...inputProps} />
      {children}
    </Root>
  );
}

PillInput.Root = Root;
PillInput.Input = Input;
PillInput.List = PillList;
PillInput.Clear = ClearButton;

export {
  PillInput,
  Root as PillInputRoot,
  Input as PillInputInput,
  PillList as PillInputList,
  ClearButton as PillInputClear,
  usePillInputContext,
};
