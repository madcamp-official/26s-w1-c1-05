/* @ds-bundle: {"format":4,"namespace":"ScrumMateDesignSystem_2f13aa","components":[{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"StatusDot","sourcePath":"components/display/StatusDot.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"ToastRegion","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Radio","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/display/Avatar.jsx":"c63550ed5144","components/display/Badge.jsx":"3aa0b4beebf6","components/display/Card.jsx":"1294700a3915","components/display/StatusDot.jsx":"7789dd8f6d86","components/display/Tag.jsx":"84400b978199","components/feedback/Dialog.jsx":"e2ae099030ea","components/feedback/Toast.jsx":"fe09f6c8e40e","components/feedback/Tooltip.jsx":"9858cb57b029","components/forms/Button.jsx":"d6a6304425c2","components/forms/Checkbox.jsx":"6d736b27ab88","components/forms/IconButton.jsx":"7aab27a705ad","components/forms/Input.jsx":"fb12e658d257","components/forms/Radio.jsx":"99f7e5242b57","components/forms/Select.jsx":"5ea6735f2b00","components/forms/Switch.jsx":"f463b7b61945","components/navigation/Tabs.jsx":"3976f042fd28","ui_kits/scrummate/BacklogScreen.jsx":"803bd58fa22c","ui_kits/scrummate/BoardScreen.jsx":"9cb6c387bdbb","ui_kits/scrummate/SettingsScreen.jsx":"4ce369b2df1c","ui_kits/scrummate/Shell.jsx":"23974cc32ea8","ui_kits/scrummate/StandupScreen.jsx":"fb9bbc3bc243","ui_kits/scrummate/data.js":"e9fb74b177f1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ScrumMateDesignSystem_2f13aa = window.ScrumMateDesignSystem_2f13aa || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-avatar-css")) {
  const s = document.createElement("style");
  s.id = "sm-avatar-css";
  s.textContent = `
.sm-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-full); background: var(--gray-150); color: var(--text-secondary); font-family: var(--font-sans); font-weight: var(--weight-semibold); flex: none; user-select: none; box-sizing: border-box; }
.sm-avatar--inverse { background: var(--ink); color: var(--text-inverse); }
.sm-avatar--outline { background: var(--paper); border: 1px dashed var(--gray-400); color: var(--text-tertiary); }
.sm-avatar-group { display: inline-flex; }
.sm-avatar-group .sm-avatar { border: 2px solid var(--paper); margin-left: -6px; }
.sm-avatar-group .sm-avatar:first-child { margin-left: 0; }
`;
  document.head.appendChild(s);
}
const AVATAR_SIZES = {
  sm: 20,
  md: 26,
  lg: 34,
  xl: 48
};
function initials(name) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function Avatar({
  name = "?",
  size = "md",
  variant = "default",
  ...rest
}) {
  const px = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  const cls = `sm-avatar${variant !== "default" ? ` sm-avatar--${variant}` : ""}`;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      width: px,
      height: px,
      fontSize: Math.round(px * 0.38)
    },
    title: name
  }, rest), name === "?" ? "?" : initials(name));
}
function AvatarGroup({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "sm-avatar-group"
  }, children);
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-badge-css")) {
  const s = document.createElement("style");
  s.id = "sm-badge-css";
  s.textContent = `
.sm-badge { display: inline-flex; align-items: center; gap: 6px; height: 20px; padding: 0 8px; border-radius: var(--radius-full); font: var(--type-overline); font-family: var(--font-sans); letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap; }
.sm-badge--outline { border: 1px solid var(--border-default); color: var(--text-secondary); background: var(--paper); }
.sm-badge--solid { background: var(--ink); color: var(--text-inverse); }
.sm-badge--subtle { background: var(--gray-100); color: var(--text-secondary); }
.sm-badge--danger { background: var(--danger); color: #fff; }
`;
  document.head.appendChild(s);
}
function Badge({
  variant = "outline",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `sm-badge sm-badge--${variant}`
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-card-css")) {
  const s = document.createElement("style");
  s.id = "sm-card-css";
  s.textContent = `
.sm-card { background: var(--surface-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-family: var(--font-sans); box-sizing: border-box; }
.sm-card--interactive { cursor: pointer; transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out); }
.sm-card--interactive:hover { border-color: var(--gray-300); background: var(--gray-50); }
.sm-card--interactive:active { background: var(--surface-hover); }
.sm-card--selected { border-color: var(--border-strong); }
.sm-card--pad-sm { padding: var(--space-3); }
.sm-card--pad-md { padding: var(--space-4); }
.sm-card--pad-lg { padding: var(--space-6); }
`;
  document.head.appendChild(s);
}
function Card({
  interactive,
  selected,
  padding = "md",
  children,
  ...rest
}) {
  const cls = ["sm-card", `sm-card--pad-${padding}`, interactive ? "sm-card--interactive" : "", selected ? "sm-card--selected" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DOT_STYLES = {
  todo: {
    background: "transparent",
    border: "1.5px solid var(--status-todo)"
  },
  progress: {
    background: "var(--status-progress)",
    border: "none"
  },
  done: {
    background: "var(--status-done)",
    border: "none"
  },
  blocked: {
    background: "var(--status-blocked)",
    border: "none"
  }
};
const STATUS_LABELS = {
  todo: "To do",
  progress: "In progress",
  done: "Done",
  blocked: "Blocked"
};
function StatusDot({
  status = "todo",
  withLabel,
  size = 8,
  style,
  ...rest
}) {
  const dot = /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: 999,
      boxSizing: "border-box",
      flex: "none",
      ...DOT_STYLES[status],
      ...(withLabel ? {} : style)
    },
    title: withLabel ? undefined : STATUS_LABELS[status]
  }, withLabel ? {} : rest));
  if (!withLabel) return dot;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      font: "var(--type-body-sm)",
      fontFamily: "var(--font-sans)",
      color: status === "blocked" ? "var(--danger)" : "var(--text-primary)",
      ...style
    }
  }, rest), dot, STATUS_LABELS[status]);
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-tag-css")) {
  const s = document.createElement("style");
  s.id = "sm-tag-css";
  s.textContent = `
.sm-tag { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border: 1px solid var(--border-default); border-radius: var(--radius-xs); font: var(--type-body-sm); font-size: var(--text-xs); font-family: var(--font-sans); color: var(--text-secondary); background: var(--paper); white-space: nowrap; }
.sm-tag__x { display: inline-flex; cursor: pointer; color: var(--text-tertiary); border: 0; background: none; padding: 0; margin-right: -2px; }
.sm-tag__x:hover { color: var(--text-primary); }
`;
  document.head.appendChild(s);
}
function Tag({
  children,
  onRemove,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "sm-tag"
  }, rest), children, onRemove ? /*#__PURE__*/React.createElement("button", {
    className: "sm-tag__x",
    "aria-label": "Remove",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-toast-css")) {
  const s = document.createElement("style");
  s.id = "sm-toast-css";
  s.textContent = `
.sm-toast { display: inline-flex; align-items: center; gap: 12px; background: var(--surface-inverse); color: var(--text-inverse); border-radius: var(--radius-md); padding: 10px 14px; font: var(--type-body-sm); font-family: var(--font-sans); box-shadow: var(--shadow-overlay); animation: sm-toast-in var(--duration-normal) var(--ease-out); }
.sm-toast__action { background: none; border: 0; color: var(--text-inverse); font: var(--type-label); font-family: var(--font-sans); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 0; }
.sm-toast__action:hover { opacity: 0.8; }
.sm-toast-region { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; z-index: 110; align-items: center; }
@keyframes sm-toast-in { from { opacity: 0; transform: translateY(6px); } }
`;
  document.head.appendChild(s);
}
function Toast({
  message,
  actionLabel,
  onAction,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "sm-toast",
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", null, message), actionLabel ? /*#__PURE__*/React.createElement("button", {
    className: "sm-toast__action",
    onClick: onAction
  }, actionLabel) : null);
}
function ToastRegion({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "sm-toast-region"
  }, children);
}
Object.assign(__ds_scope, { Toast, ToastRegion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
if (typeof document !== "undefined" && !document.getElementById("sm-tooltip-css")) {
  const s = document.createElement("style");
  s.id = "sm-tooltip-css";
  s.textContent = `
.sm-tooltip-anchor { position: relative; display: inline-flex; }
.sm-tooltip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(2px); background: var(--surface-inverse); color: var(--text-inverse); font: var(--type-body-sm); font-size: var(--text-xs); font-family: var(--font-sans); padding: 4px 8px; border-radius: var(--radius-xs); white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out); z-index: 90; }
.sm-tooltip-anchor:hover .sm-tooltip, .sm-tooltip-anchor:focus-within .sm-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
.sm-tooltip__kbd { font-family: var(--font-mono); color: var(--gray-400); margin-left: 6px; }
`;
  document.head.appendChild(s);
}
function Tooltip({
  content,
  shortcut,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "sm-tooltip-anchor",
    style: style
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "sm-tooltip",
    role: "tooltip"
  }, content, shortcut ? /*#__PURE__*/React.createElement("span", {
    className: "sm-tooltip__kbd"
  }, shortcut) : null));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-button-css")) {
  const s = document.createElement("style");
  s.id = "sm-button-css";
  s.textContent = `
.sm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: var(--radius-sm); font: var(--type-label); font-family: var(--font-sans); cursor: pointer; transition: background var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out); border: 1px solid transparent; white-space: nowrap; }
.sm-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.sm-btn[disabled] { cursor: default; pointer-events: none; }
.sm-btn--primary { background: var(--ink); color: var(--text-inverse); border-color: var(--ink); }
.sm-btn--primary:hover { opacity: 0.88; }
.sm-btn--primary:active { opacity: 0.8; }
.sm-btn--primary[disabled] { background: var(--gray-300); border-color: var(--gray-300); }
.sm-btn--secondary { background: var(--paper); color: var(--text-primary); border-color: var(--border-default); }
.sm-btn--secondary:hover { background: var(--surface-hover); }
.sm-btn--secondary:active { background: var(--surface-active); }
.sm-btn--secondary[disabled] { color: var(--text-disabled); }
.sm-btn--ghost { background: transparent; color: var(--text-primary); }
.sm-btn--ghost:hover { background: var(--surface-hover); }
.sm-btn--ghost:active { background: var(--surface-active); }
.sm-btn--ghost[disabled] { color: var(--text-disabled); }
.sm-btn--danger { background: var(--danger); color: #fff; border-color: var(--danger); }
.sm-btn--danger:hover { background: var(--danger-hover); }
.sm-btn--sm { height: var(--control-height-sm); padding: 0 10px; font-size: var(--text-xs); }
.sm-btn--md { height: var(--control-height-md); padding: 0 14px; }
.sm-btn--lg { height: var(--control-height-lg); padding: 0 18px; font-size: var(--text-md); }
`;
  document.head.appendChild(s);
}
function Button({
  variant = "secondary",
  size = "md",
  disabled,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `sm-btn sm-btn--${variant} sm-btn--${size}`,
    disabled: disabled
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
if (typeof document !== "undefined" && !document.getElementById("sm-dialog-css")) {
  const s = document.createElement("style");
  s.id = "sm-dialog-css";
  s.textContent = `
.sm-dialog-scrim { position: fixed; inset: 0; background: rgba(10,10,10,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; animation: sm-fade var(--duration-normal) var(--ease-out); }
.sm-dialog { background: var(--paper); border-radius: var(--radius-lg); box-shadow: var(--shadow-overlay); width: 440px; max-width: calc(100vw - 48px); font-family: var(--font-sans); animation: sm-pop var(--duration-normal) var(--ease-out); }
.sm-dialog__body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
.sm-dialog__title { font: var(--type-h3); margin: 0; }
.sm-dialog__desc { font: var(--type-body); color: var(--text-secondary); margin: 0; }
.sm-dialog__footer { display: flex; justify-content: flex-end; gap: var(--space-2); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-muted); }
@keyframes sm-fade { from { opacity: 0; } }
@keyframes sm-pop { from { opacity: 0; transform: scale(0.98); } }
`;
  document.head.appendChild(s);
}
function Dialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "sm-dialog-scrim",
    onClick: e => e.target === e.currentTarget && onCancel && onCancel()
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-dialog",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "sm-dialog__body"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "sm-dialog__title"
  }, title), typeof children === "string" ? /*#__PURE__*/React.createElement("p", {
    className: "sm-dialog__desc"
  }, children) : children), /*#__PURE__*/React.createElement("div", {
    className: "sm-dialog__footer"
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    onClick: onCancel
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: danger ? "danger" : "primary",
    onClick: onConfirm
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-check-css")) {
  const s = document.createElement("style");
  s.id = "sm-check-css";
  s.textContent = `
.sm-check { display: inline-flex; align-items: center; gap: 8px; font: var(--type-body-sm); font-family: var(--font-sans); cursor: pointer; user-select: none; }
.sm-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.sm-check__box { width: 16px; height: 16px; border: 1px solid var(--gray-400); border-radius: var(--radius-xs); background: var(--paper); display: inline-flex; align-items: center; justify-content: center; transition: background var(--duration-fast) var(--ease-out); flex: none; box-sizing: border-box; }
.sm-check__box svg { opacity: 0; }
.sm-check input:checked + .sm-check__box { background: var(--ink); border-color: var(--ink); }
.sm-check input:checked + .sm-check__box svg { opacity: 1; }
.sm-check input:focus-visible + .sm-check__box { box-shadow: var(--focus-ring); }
.sm-check--disabled { color: var(--text-disabled); cursor: default; }
.sm-check--disabled .sm-check__box { background: var(--surface-sunken); border-color: var(--border-default); }
.sm-check--radio .sm-check__box { border-radius: var(--radius-full); }
.sm-check--radio input:checked + .sm-check__box { background: var(--paper); border: 5px solid var(--ink); }
`;
  document.head.appendChild(s);
}
function Checkbox({
  label,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `sm-check${disabled ? " sm-check--disabled" : ""}`,
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sm-check__box"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
function Radio({
  label,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `sm-check sm-check--radio${disabled ? " sm-check--disabled" : ""}`,
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sm-check__box"
  }), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Checkbox, Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-iconbutton-css")) {
  const s = document.createElement("style");
  s.id = "sm-iconbutton-css";
  s.textContent = `
.sm-iconbtn { display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); border: 1px solid transparent; background: transparent; color: var(--text-secondary); cursor: pointer; transition: background var(--duration-fast) var(--ease-out); }
.sm-iconbtn:hover { background: var(--surface-hover); color: var(--text-primary); }
.sm-iconbtn:active { background: var(--surface-active); }
.sm-iconbtn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.sm-iconbtn--bordered { border-color: var(--border-default); background: var(--paper); }
.sm-iconbtn[disabled] { color: var(--text-disabled); pointer-events: none; }
.sm-iconbtn--sm { width: var(--control-height-sm); height: var(--control-height-sm); }
.sm-iconbtn--md { width: var(--control-height-md); height: var(--control-height-md); }
.sm-iconbtn--lg { width: var(--control-height-lg); height: var(--control-height-lg); }
`;
  document.head.appendChild(s);
}
function IconButton({
  size = "md",
  bordered,
  label,
  disabled,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `sm-iconbtn sm-iconbtn--${size}${bordered ? " sm-iconbtn--bordered" : ""}`,
    "aria-label": label,
    title: label,
    disabled: disabled
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-input-css")) {
  const s = document.createElement("style");
  s.id = "sm-input-css";
  s.textContent = `
.sm-field { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-sans); }
.sm-field__label { font: var(--type-label); color: var(--text-primary); }
.sm-field__hint { font: var(--type-body-sm); font-size: var(--text-xs); color: var(--text-tertiary); }
.sm-field__hint--error { color: var(--danger); }
.sm-input { height: var(--control-height-md); padding: 0 10px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); font: var(--type-body); font-family: var(--font-sans); color: var(--text-primary); background: var(--paper); transition: border-color var(--duration-fast) var(--ease-out); box-sizing: border-box; width: 100%; }
.sm-input::placeholder { color: var(--text-tertiary); }
.sm-input:hover { border-color: var(--gray-300); }
.sm-input:focus { outline: none; border-color: var(--border-focus); }
.sm-input[disabled] { background: var(--surface-sunken); color: var(--text-disabled); }
.sm-input--error { border-color: var(--danger); }
textarea.sm-input { height: auto; min-height: 72px; padding: 8px 10px; resize: vertical; }
`;
  document.head.appendChild(s);
}
function Input({
  label,
  hint,
  error,
  multiline,
  style,
  ...rest
}) {
  const cls = `sm-input${error ? " sm-input--error" : ""}`;
  const control = multiline ? /*#__PURE__*/React.createElement("textarea", _extends({
    className: cls
  }, rest)) : /*#__PURE__*/React.createElement("input", _extends({
    className: cls
  }, rest));
  return /*#__PURE__*/React.createElement("label", {
    className: "sm-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "sm-field__label"
  }, label) : null, control, error ? /*#__PURE__*/React.createElement("span", {
    className: "sm-field__hint sm-field__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sm-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {

Object.assign(__ds_scope, { Radio: __ds_scope.Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-select-css")) {
  const s = document.createElement("style");
  s.id = "sm-select-css";
  s.textContent = `
.sm-select-wrap { position: relative; display: flex; flex-direction: column; gap: 6px; font-family: var(--font-sans); }
.sm-select-wrap__label { font: var(--type-label); }
.sm-select { appearance: none; height: var(--control-height-md); padding: 0 30px 0 10px; border: 1px solid var(--border-default); border-radius: var(--radius-sm); font: var(--type-body); font-family: var(--font-sans); color: var(--text-primary); background: var(--paper); cursor: pointer; width: 100%; box-sizing: border-box; }
.sm-select:hover { border-color: var(--gray-300); }
.sm-select:focus { outline: none; border-color: var(--border-focus); }
.sm-select[disabled] { background: var(--surface-sunken); color: var(--text-disabled); }
.sm-select-wrap__chev { position: absolute; right: 10px; bottom: 10px; pointer-events: none; color: var(--text-tertiary); }
`;
  document.head.appendChild(s);
}
function Select({
  label,
  options = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "sm-select-wrap",
    style: style
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "sm-select-wrap__label"
  }, label) : null, /*#__PURE__*/React.createElement("select", _extends({
    className: "sm-select"
  }, rest), options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement("svg", {
    className: "sm-select-wrap__chev",
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
if (typeof document !== "undefined" && !document.getElementById("sm-switch-css")) {
  const s = document.createElement("style");
  s.id = "sm-switch-css";
  s.textContent = `
.sm-switch { display: inline-flex; align-items: center; gap: 8px; font: var(--type-body-sm); font-family: var(--font-sans); cursor: pointer; user-select: none; }
.sm-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.sm-switch__track { width: 32px; height: 18px; border-radius: var(--radius-full); background: var(--gray-300); position: relative; transition: background var(--duration-normal) var(--ease-out); flex: none; }
.sm-switch__track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 999px; background: var(--paper); transition: transform var(--duration-normal) var(--ease-out); }
.sm-switch input:checked + .sm-switch__track { background: var(--ink); }
.sm-switch input:checked + .sm-switch__track::after { transform: translateX(14px); }
.sm-switch input:focus-visible + .sm-switch__track { box-shadow: var(--focus-ring); }
.sm-switch--disabled { color: var(--text-disabled); cursor: default; }
.sm-switch--disabled .sm-switch__track { background: var(--gray-200); }
`;
  document.head.appendChild(s);
}
function Switch({
  label,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: `sm-switch${disabled ? " sm-switch--disabled" : ""}`,
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sm-switch__track"
  }), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
if (typeof document !== "undefined" && !document.getElementById("sm-tabs-css")) {
  const s = document.createElement("style");
  s.id = "sm-tabs-css";
  s.textContent = `
.sm-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-default); font-family: var(--font-sans); }
.sm-tabs__tab { appearance: none; background: none; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; padding: 8px 12px; font: var(--type-label); font-family: var(--font-sans); color: var(--text-secondary); cursor: pointer; transition: color var(--duration-fast) var(--ease-out); display: inline-flex; align-items: center; gap: 6px; }
.sm-tabs__tab:hover { color: var(--text-primary); }
.sm-tabs__tab:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-xs); }
.sm-tabs__tab--active { color: var(--text-primary); border-bottom-color: var(--ink); }
.sm-tabs__count { font: var(--type-mono); font-size: 11px; color: var(--text-tertiary); }
`;
  document.head.appendChild(s);
}
function Tabs({
  tabs = [],
  active,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "sm-tabs",
    role: "tablist",
    style: style
  }, tabs.map(t => {
    const tab = typeof t === "string" ? {
      id: t,
      label: t
    } : t;
    const isActive = tab.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.id,
      role: "tab",
      "aria-selected": isActive,
      className: `sm-tabs__tab${isActive ? " sm-tabs__tab--active" : ""}`,
      onClick: () => onChange && onChange(tab.id)
    }, tab.label, tab.count != null ? /*#__PURE__*/React.createElement("span", {
      className: "sm-tabs__count"
    }, tab.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/BacklogScreen.jsx
try { (() => {
// Backlog screen: table-like rows with checkboxes, tags, points, move-to-sprint.
function SMBacklogScreen({
  backlog,
  onMoveToSprint
}) {
  const {
    Checkbox,
    Tag,
    Button,
    Badge
  } = window.ScrumMateDesignSystem_2f13aa;
  const [checked, setChecked] = React.useState({});
  const selectedIds = Object.keys(checked).filter(k => checked[k]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760
    },
    "data-screen-label": "Backlog"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--text-secondary)"
    }
  }, backlog.length, " items \xB7 ", backlog.reduce((a, b) => a + b.points, 0), " points"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    disabled: selectedIds.length === 0,
    onClick: () => {
      onMoveToSprint(selectedIds);
      setChecked({});
    }
  }, "Move ", selectedIds.length > 0 ? selectedIds.length + " " : "", "to sprint"))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      overflow: "hidden"
    }
  }, backlog.map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    "data-comment-anchor": "backlog-" + item.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderTop: i === 0 ? "none" : "1px solid var(--border-muted)",
      background: checked[item.id] ? "var(--gray-50)" : "var(--paper)"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: !!checked[item.id],
    onChange: e => setChecked({
      ...checked,
      [item.id]: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      fontWeight: 500,
      width: 58,
      flex: "none"
    }
  }, item.id), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-body)",
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, item.title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 6
    }
  }, item.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      color: "var(--text-tertiary)",
      width: 20,
      textAlign: "right"
    }
  }, item.points))), backlog.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-6)",
      font: "var(--type-body)",
      color: "var(--text-secondary)"
    }
  }, "No items in the backlog.") : null));
}
Object.assign(window, {
  SMBacklogScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/BacklogScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/BoardScreen.jsx
try { (() => {
// Kanban board screen: 4 columns, clickable cards, add-task composer in To do.
function SMTaskCard({
  task,
  onClick
}) {
  const {
    Card,
    Tag,
    Avatar,
    StatusDot
  } = window.ScrumMateDesignSystem_2f13aa;
  return /*#__PURE__*/React.createElement(Card, {
    interactive: true,
    padding: "sm",
    onClick: onClick,
    "data-comment-anchor": "task-" + task.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      fontWeight: 500
    }
  }, task.id), /*#__PURE__*/React.createElement(StatusDot, {
    status: task.status
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)",
      lineHeight: 1.35
    }
  }, task.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, task.tags.map(t => /*#__PURE__*/React.createElement(Tag, {
    key: t
  }, t)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      color: "var(--text-tertiary)"
    }
  }, task.points), task.assignee ? /*#__PURE__*/React.createElement(Avatar, {
    name: task.assignee,
    size: "sm"
  }) : /*#__PURE__*/React.createElement(Avatar, {
    variant: "outline",
    size: "sm",
    title: "Unassigned"
  })))));
}
function SMBoardScreen({
  tasks,
  onAddTask,
  onTaskClick
}) {
  const {
    Button,
    Badge
  } = window.ScrumMateDesignSystem_2f13aa;
  const [composing, setComposing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const columns = [{
    id: "todo",
    label: "To do"
  }, {
    id: "progress",
    label: "In progress"
  }, {
    id: "blocked",
    label: "Blocked"
  }, {
    id: "done",
    label: "Done"
  }];
  const submit = () => {
    if (draft.trim()) onAddTask(draft.trim());
    setDraft("");
    setComposing(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "var(--space-4)",
      alignItems: "start"
    },
    "data-screen-label": "Board"
  }, columns.map(col => {
    const items = tasks.filter(t => t.status === col.id);
    return /*#__PURE__*/React.createElement("section", {
      key: col.id,
      style: {
        background: "var(--surface-sunken)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        minHeight: 120
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 4px 6px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-overline)",
        letterSpacing: "var(--tracking-wide)",
        textTransform: "uppercase",
        color: col.id === "blocked" && items.length ? "var(--danger)" : "var(--text-secondary)"
      }
    }, col.label), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--type-mono)",
        color: "var(--text-tertiary)"
      }
    }, items.length)), items.map(t => /*#__PURE__*/React.createElement(SMTaskCard, {
      key: t.id,
      task: t,
      onClick: () => onTaskClick(t)
    })), items.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        font: "var(--type-body-sm)",
        color: "var(--text-tertiary)",
        padding: "6px 4px"
      }
    }, "Nothing here.") : null, col.id === "todo" ? composing ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      value: draft,
      onChange: e => setDraft(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") setComposing(false);
      },
      placeholder: "What needs doing?",
      style: {
        height: "var(--control-height-md)",
        padding: "0 10px",
        border: "1px solid var(--border-focus)",
        borderRadius: "var(--radius-sm)",
        font: "var(--type-body)",
        fontFamily: "var(--font-sans)",
        outline: "none",
        boxSizing: "border-box",
        width: "100%"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: submit
    }, "Add task"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setComposing(false)
    }, "Cancel"))) : /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setComposing(true),
      style: {
        justifyContent: "flex-start"
      }
    }, /*#__PURE__*/React.createElement(SMIcon, {
      name: "plus",
      size: 14
    }), " Add task") : null);
  }));
}
Object.assign(window, {
  SMBoardScreen,
  SMTaskCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/BoardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/SettingsScreen.jsx
try { (() => {
// Settings screen: workspace + notification preferences using form primitives.
function SMSettingsScreen() {
  const {
    Card,
    Input,
    Select,
    Switch,
    Button
  } = window.ScrumMateDesignSystem_2f13aa;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 520,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    },
    "data-screen-label": "Settings"
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--type-h3)",
      margin: 0
    }
  }, "Workspace"), /*#__PURE__*/React.createElement(Input, {
    label: "Team name",
    defaultValue: "Nightjar Studio"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Sprint length",
    options: ["1 week", "2 weeks", "3 weeks"],
    defaultValue: "2 weeks"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Week starts on",
    options: ["Monday", "Sunday"]
  })))), /*#__PURE__*/React.createElement(Card, {
    padding: "lg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--type-h3)",
      margin: 0
    }
  }, "Notifications"), /*#__PURE__*/React.createElement(Switch, {
    label: "Standup reminder at 9:30",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Email me a standup summary",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Notify when a task is blocked",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "Weekly sprint digest"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Save changes"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Cancel")));
}
Object.assign(window, {
  SMSettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/Shell.jsx
try { (() => {
// App shell: fixed sunken sidebar + topbar. Icons are copied Lucide path data (16px, stroke).
const SM_ICON_PATHS = {
  board: "M8 3v18M16 3v18M3 3h18v18H3z",
  backlog: "M3 6h18M3 12h18M3 18h12",
  standup: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  search: "m21 21-4.34-4.34M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z",
  plus: "M5 12h14M12 5v14"
};
function SMIcon({
  name,
  size = 16
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: SM_ICON_PATHS[name]
  }));
}
const smShellStyles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "var(--surface-page)",
    fontFamily: "var(--font-sans)",
    overflow: "hidden"
  },
  sidebar: {
    width: "var(--sidebar-width)",
    flex: "none",
    background: "var(--surface-sunken)",
    borderRight: "1px solid var(--border-muted)",
    display: "flex",
    flexDirection: "column",
    padding: "var(--space-4) var(--space-3)",
    boxSizing: "border-box",
    gap: 4
  },
  word: {
    font: "var(--weight-semibold) 17px/1 var(--font-sans)",
    letterSpacing: "var(--tracking-tight)",
    padding: "6px 10px 18px"
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  topbar: {
    height: "var(--topbar-height)",
    flex: "none",
    borderBottom: "1px solid var(--border-muted)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 var(--space-6)"
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "var(--space-6)"
  }
};
function SMNavItem({
  id,
  label,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onClick(id),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 32,
      padding: "0 10px",
      border: 0,
      borderRadius: "var(--radius-sm)",
      cursor: "pointer",
      width: "100%",
      font: "var(--type-label)",
      fontFamily: "var(--font-sans)",
      textAlign: "left",
      background: active ? "var(--ink)" : hover ? "var(--gray-150)" : "transparent",
      color: active ? "var(--text-inverse)" : "var(--text-primary)",
      transition: "background var(--duration-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement(SMIcon, {
    name: id
  }), label);
}
function SMShell({
  view,
  onNavigate,
  title,
  actions,
  children
}) {
  const {
    Avatar,
    AvatarGroup,
    Badge
  } = window.ScrumMateDesignSystem_2f13aa;
  const D = window.SM_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: smShellStyles.root
  }, /*#__PURE__*/React.createElement("nav", {
    style: smShellStyles.sidebar,
    "data-screen-label": "Sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    style: smShellStyles.word
  }, "ScrumMate"), /*#__PURE__*/React.createElement(SMNavItem, {
    id: "board",
    label: "Board",
    active: view === "board",
    onClick: onNavigate
  }), /*#__PURE__*/React.createElement(SMNavItem, {
    id: "backlog",
    label: "Backlog",
    active: view === "backlog",
    onClick: onNavigate
  }), /*#__PURE__*/React.createElement(SMNavItem, {
    id: "standup",
    label: "Standup",
    active: view === "standup",
    onClick: onNavigate
  }), /*#__PURE__*/React.createElement(SMNavItem, {
    id: "settings",
    label: "Settings",
    active: view === "settings",
    onClick: onNavigate
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "0 10px 4px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--type-overline)",
      letterSpacing: "var(--tracking-wide)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)"
    }
  }, "Team"), /*#__PURE__*/React.createElement(AvatarGroup, null, D.team.map(n => /*#__PURE__*/React.createElement(Avatar, {
    key: n,
    name: n,
    size: "sm"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: smShellStyles.main
  }, /*#__PURE__*/React.createElement("header", {
    style: smShellStyles.topbar
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-h3)",
      margin: 0,
      letterSpacing: "var(--tracking-tight)"
    }
  }, title), /*#__PURE__*/React.createElement(Badge, null, D.sprint.name), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      color: "var(--text-tertiary)"
    }
  }, D.sprint.range), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: smShellStyles.content
  }, children)));
}
Object.assign(window, {
  SMShell,
  SMIcon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/StandupScreen.jsx
try { (() => {
// Standup screen: per-person yesterday/today/blocked cards + sprint progress.
function SMStandupScreen({
  entries,
  sprint
}) {
  const {
    Card,
    Avatar,
    Badge,
    StatusDot
  } = window.ScrumMateDesignSystem_2f13aa;
  const pct = Math.round(sprint.done / sprint.total * 100);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    },
    "data-screen-label": "Standup"
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)"
    }
  }, sprint.name), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 6,
      background: "var(--gray-150)",
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: "var(--ink)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-mono)",
      color: "var(--text-secondary)"
    }
  }, sprint.done, " / ", sprint.total, " done"))), entries.map(e => /*#__PURE__*/React.createElement(Card, {
    key: e.name,
    padding: "md",
    "data-comment-anchor": "standup-" + e.name.split(" ")[0]
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: e.name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-label)"
    }
  }, e.name), e.blocked ? /*#__PURE__*/React.createElement(Badge, {
    variant: "danger"
  }, "Blocked") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "84px 1fr",
      gap: "4px 12px",
      font: "var(--type-body-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)"
    }
  }, "Yesterday"), /*#__PURE__*/React.createElement("span", null, e.yesterday), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)"
    }
  }, "Today"), /*#__PURE__*/React.createElement("span", null, e.today), e.blocked ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, "Blocked"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, e.blocked)) : null))))));
}
Object.assign(window, {
  SMStandupScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/StandupScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/scrummate/data.js
try { (() => {
// Shared fake data for the ScrumMate UI kit.
window.SM_DATA = {
  team: ["Maya Chen", "Tomas Ruiz", "Ana Silva", "Jon Park", "Priya Nair"],
  sprint: {
    name: "Sprint 14",
    range: "Jun 30 – Jul 11",
    done: 8,
    total: 13
  },
  tasks: [{
    id: "SM-138",
    title: "Design empty state for backlog",
    status: "todo",
    tags: ["design"],
    assignee: "Ana Silva",
    points: 2
  }, {
    id: "SM-141",
    title: "Rate-limit invite emails",
    status: "todo",
    tags: ["api"],
    assignee: null,
    points: 3
  }, {
    id: "SM-144",
    title: "Keyboard shortcuts for board navigation",
    status: "todo",
    tags: ["frontend"],
    assignee: "Jon Park",
    points: 5
  }, {
    id: "SM-142",
    title: "Fix sprint burndown rounding",
    status: "progress",
    tags: ["frontend", "bug"],
    assignee: "Maya Chen",
    points: 2
  }, {
    id: "SM-139",
    title: "Standup summary email template",
    status: "progress",
    tags: ["design", "email"],
    assignee: "Priya Nair",
    points: 3
  }, {
    id: "SM-136",
    title: "Migrate sessions to new auth service",
    status: "blocked",
    tags: ["api"],
    assignee: "Tomas Ruiz",
    points: 8
  }, {
    id: "SM-131",
    title: "Sprint archive page",
    status: "done",
    tags: ["frontend"],
    assignee: "Maya Chen",
    points: 5
  }, {
    id: "SM-133",
    title: "CSV export for backlog",
    status: "done",
    tags: ["api"],
    assignee: "Tomas Ruiz",
    points: 3
  }, {
    id: "SM-135",
    title: "Onboarding checklist copy",
    status: "done",
    tags: ["design"],
    assignee: "Ana Silva",
    points: 1
  }],
  backlog: [{
    id: "SM-145",
    title: "Dark mode exploration",
    tags: ["design"],
    points: 5
  }, {
    id: "SM-146",
    title: "Slack integration for standup reminders",
    tags: ["api"],
    points: 8
  }, {
    id: "SM-147",
    title: "Board column WIP limits",
    tags: ["frontend"],
    points: 3
  }, {
    id: "SM-148",
    title: "Guest (read-only) seats",
    tags: ["api"],
    points: 5
  }, {
    id: "SM-149",
    title: "Sprint velocity chart",
    tags: ["frontend"],
    points: 5
  }, {
    id: "SM-150",
    title: "Duplicate task action",
    tags: ["frontend"],
    points: 1
  }],
  standup: [{
    name: "Maya Chen",
    yesterday: "Shipped sprint archive page.",
    today: "Burndown rounding fix, then review queue.",
    blocked: null
  }, {
    name: "Tomas Ruiz",
    yesterday: "CSV export merged.",
    today: "Auth service migration.",
    blocked: "Waiting on infra for the new auth service credentials."
  }, {
    name: "Ana Silva",
    yesterday: "Onboarding checklist copy done.",
    today: "Backlog empty-state design.",
    blocked: null
  }, {
    name: "Jon Park",
    yesterday: "Spiked keyboard navigation.",
    today: "Implement j/k task traversal.",
    blocked: null
  }, {
    name: "Priya Nair",
    yesterday: "Email template first pass.",
    today: "Template review with Ana.",
    blocked: null
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/scrummate/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToastRegion = __ds_scope.ToastRegion;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
