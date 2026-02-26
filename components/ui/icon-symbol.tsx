// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Shreeji Associates
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "doc.text.fill": "description",
  "building.columns.fill": "account-balance",
  "doc.badge.plus": "post-add",
  "sparkles": "auto-awesome",
  // General
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "plus": "add",
  "xmark": "close",
  "checkmark": "check",
  "trash": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "person.fill": "person",
  "person.circle.fill": "account-circle",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "arrow.right.square.fill": "logout",
  "person.2.fill": "group",
  "briefcase.fill": "work",
  "calendar": "calendar-today",
  "clock.fill": "schedule",
  "dollarsign.circle.fill": "attach-money",
  "doc.fill": "insert-drive-file",
  "folder.fill": "folder",
  "arrow.up.doc.fill": "upload-file",
  "arrow.down.doc.fill": "download",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "ellipsis": "more-horiz",
  "gearshape.fill": "settings",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "printer.fill": "print",
  "mic.fill": "mic",
  "stop.fill": "stop",
  "checklist": "checklist",
  "person.badge.plus": "person-add",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
