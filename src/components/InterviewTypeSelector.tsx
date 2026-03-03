"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  FolderKanban,
  Network,
  BookOpen,
  Check,
  ChevronDown,
  LayoutGrid,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  INTERVIEW_TYPES,
  type StaticInterviewType,
} from "@/data/interview-types";
import type { InterviewTypeCode } from "@/types/interview";

// 아이콘 매핑
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  FolderKanban,
  Network,
  BookOpen,
};

// 색상 매핑 (Tailwind 클래스)
const COLOR_MAP: Record<
  string,
  {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
    selectedBg: string;
    hoverBorder: string;
  }
> = {
  blue: {
    bg: "bg-blue-100",
    bgLight: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-600",
    selectedBg: "bg-blue-50",
    hoverBorder: "hover:border-blue-200",
  },
  green: {
    bg: "bg-emerald-100",
    bgLight: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-600",
    selectedBg: "bg-emerald-50",
    hoverBorder: "hover:border-emerald-200",
  },
  purple: {
    bg: "bg-purple-100",
    bgLight: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-600",
    selectedBg: "bg-purple-50",
    hoverBorder: "hover:border-purple-200",
  },
  amber: {
    bg: "bg-amber-100",
    bgLight: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-600",
    selectedBg: "bg-amber-50",
    hoverBorder: "hover:border-amber-200",
  },
};

// ── 입력창 하단 툴바에 배치되는 면접 범주 선택 트리거 + Popover ──
interface InterviewTypePopoverSelectorProps {
  selectedTypeCode: InterviewTypeCode | null;
  onSelect: (typeCode: InterviewTypeCode | null) => void;
  disabled?: boolean;
}

export function InterviewTypePopoverSelector({
  selectedTypeCode,
  onSelect,
  disabled = false,
}: InterviewTypePopoverSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedType = selectedTypeCode
    ? INTERVIEW_TYPES.find((t) => t.code === selectedTypeCode)
    : null;
  const selectedColors = selectedType
    ? (COLOR_MAP[selectedType.color] ?? COLOR_MAP.blue)
    : null;
  const SelectedIcon = selectedType
    ? (ICON_MAP[selectedType.icon] ?? Brain)
    : null;

  const handleSelect = (code: InterviewTypeCode) => {
    if (disabled) return;
    // 같은 범주 클릭 시 선택 해제
    onSelect(selectedTypeCode === code ? null : code);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 text-xs md:text-sm transition-colors",
            "focus:outline-none focus-visible:outline-none",
            disabled && "opacity-50 cursor-not-allowed",
            selectedType && selectedColors
              ? selectedColors.text
              : "text-muted-foreground hover:text-foreground cursor-pointer",
          )}
        >
          {selectedType && SelectedIcon && selectedColors ? (
            <SelectedIcon
              className={cn("w-3.5 h-3.5 md:w-4 md:h-4", selectedColors.text)}
            />
          ) : (
            <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
          <span>{selectedType ? selectedType.displayName : "면접 범주"}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[calc(100vw-2rem)] max-w-[480px] p-3"
        sideOffset={8}
      >
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">
            선택한 범주에 맞게 AI 면접 질문이 특화됩니다
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTERVIEW_TYPES.map((type) => {
              const isSelected = selectedTypeCode === type.code;
              const IconComponent = ICON_MAP[type.icon] ?? Brain;
              const colors = COLOR_MAP[type.color] ?? COLOR_MAP.blue;

              return (
                <motion.button
                  key={type.code}
                  type="button"
                  onClick={() => handleSelect(type.code)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "relative flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all duration-150",
                    "focus:outline-none focus-visible:outline-none",
                    isSelected
                      ? `${colors.selectedBg} ${colors.border}`
                      : "bg-card border-border/40 hover:border-border/70 hover:bg-muted/30",
                  )}
                >
                  {/* 선택 체크 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center",
                        colors.bg,
                        colors.text,
                      )}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </motion.div>
                  )}

                  {/* 아이콘 */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                      colors.bg,
                    )}
                  >
                    <IconComponent className={cn("w-4 h-4", colors.text)} />
                  </div>

                  {/* 제목 */}
                  <span
                    className={cn(
                      "text-sm font-semibold mb-1",
                      isSelected ? colors.text : "text-foreground",
                    )}
                  >
                    {type.displayName}
                  </span>

                  {/* 설명 */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── 검색창 내부에 표시되는 선택된 면접 범주 Pill ──
interface SelectedInterviewTypePillProps {
  type: StaticInterviewType;
  onRemove: () => void;
}

export function SelectedInterviewTypePill({
  type,
  onRemove,
}: SelectedInterviewTypePillProps) {
  const IconComponent = ICON_MAP[type.icon] ?? Brain;
  const colors = COLOR_MAP[type.color] ?? COLOR_MAP.blue;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border",
        colors.bgLight,
        colors.border,
        colors.text,
      )}
    >
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span>{type.displayName}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          "ml-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-colors",
          "hover:bg-black/10",
        )}
        aria-label={`${type.displayName} 제거`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ── 선택된 면접 범주를 배지로 표시하는 컴포넌트 (아카이브 등에서 사용) ──
interface InterviewTypeBadgeProps {
  type: { displayName: string; icon: string | null; color: string | null };
  size?: "sm" | "md";
}

export function InterviewTypeBadge({
  type,
  size = "sm",
}: InterviewTypeBadgeProps) {
  const IconComponent = ICON_MAP[type.icon ?? "Brain"] ?? Brain;
  const colors = COLOR_MAP[type.color ?? "blue"] ?? COLOR_MAP.blue;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        colors.bg,
        colors.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      <IconComponent className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
      {type.displayName}
    </span>
  );
}
