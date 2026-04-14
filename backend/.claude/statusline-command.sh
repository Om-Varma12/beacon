#!/usr/bin/env bash
input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name // "unknown"')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // 0')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // ""' | sed "s|^$HOME|~|")
branch=$(echo "$input" | jq -r '.workspace.git_worktree // empty')
five_h=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
seven_d=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

# Build context string
ctx_str=""
if [ -n "$used" ]; then
  ctx_str="ctx:${used}%"
fi

# Build rate limit string
rate_str=""
if [ -n "$five_h" ]; then
  rate_str="5h:$(printf '%.0f' "$five_h")%"
fi
if [ -n "$seven_d" ]; then
  rate_str="${rate_str:+$rate_str }7d:$(printf '%.0f' "$seven_d")%"
fi

# Build output
out="$model"
if [ -n "$branch" ]; then
  out="$out [$branch]"
fi
out="$out $cwd"
if [ -n "$ctx_str" ]; then
  out="$out | $ctx_str"
fi
if [ -n "$rate_str" ]; then
  out="$out | $rate_str"
fi

echo "$out"