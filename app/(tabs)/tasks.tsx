import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, FlatList, Modal, TextInput,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/app-auth-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { exportToExcel } from "@/lib/excel-export";

type Priority = "low" | "medium" | "high";
type TaskStatus = "pending" | "in_progress" | "completed";

interface TaskRecord {
  id: number;
  title: string;
  description?: string | null;
  assignedTo: number;
  assignedBy: number;
  dueDate?: string | null;
  priority: Priority;
  status: TaskStatus;
  completedAt?: Date | null;
  createdAt: Date;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#F59E0B",
  in_progress: "#3B82F6",
  completed: "#22C55E",
};

interface FormState {
  title: string;
  description: string;
  assignedTo: number | null;
  dueDate: string;
  priority: Priority;
}

const EMPTY_FORM: FormState = {
  title: "", description: "", assignedTo: null, dueDate: "", priority: "medium",
};

export default function TasksScreen() {
  const colors = useColors();
  const { user, token } = useAppAuth();
  const isAdmin = user?.role === "admin";

  const [modalVisible, setModalVisible] = useState(false);
  const [editTask, setEditTask] = useState<TaskRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (tasks.length === 0) { Alert.alert("No Data", "There are no tasks to export."); return; }
    setExporting(true);
    try {
      const rows = tasks.map((t) => ({
        "Task Title": t.title,
        "Description": t.description ?? "",
        "Assigned To": getMemberName(t.assignedTo),
        "Priority": t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
        "Status": STATUS_LABELS[t.status],
        "Due Date": t.dueDate ?? "",
        "Created At": new Date(t.createdAt).toLocaleDateString(),
        "Completed At": t.completedAt ? new Date(t.completedAt).toLocaleDateString() : "",
      }));
      const today = new Date().toISOString().slice(0, 10);
      await exportToExcel(rows, "Task Assignments", `Tasks_Report_${today}`);
    } catch (e: any) {
      Alert.alert("Export Failed", e.message || "Could not export tasks.");
    } finally {
      setExporting(false);
    }
  };

  // Admin sees all tasks; member sees their own
  const { data: allTasks = [], refetch: refetchAll } = trpc.tasks.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: myTasks = [], refetch: refetchMine } = trpc.tasks.listForUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user && !isAdmin }
  );
  const { data: teamMembers = [] } = trpc.team.allMembers.useQuery(
    { token: token ?? "" },
    { enabled: isAdmin && !!token }
  );

  const tasks: TaskRecord[] = (isAdmin ? allTasks : myTasks) as TaskRecord[];
  const approvedMembers = (teamMembers as TeamMember[]).filter((m) => m.status === "approved" && m.role !== "admin");

  const refetch = () => { if (isAdmin) refetchAll(); else refetchMine(); };

  const createMutation = trpc.tasks.create.useMutation({ onSuccess: () => { refetch(); closeModal(); } });
  const updateMutation = trpc.tasks.update.useMutation({ onSuccess: () => { refetch(); closeModal(); } });
  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.tasks.delete.useMutation({ onSuccess: () => refetch() });

  const set = (key: keyof FormState) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const openAdd = () => { setForm(EMPTY_FORM); setEditTask(null); setModalVisible(true); };
  const openEdit = (t: TaskRecord) => {
    setForm({
      title: t.title, description: t.description ?? "",
      assignedTo: t.assignedTo, dueDate: t.dueDate ?? "",
      priority: t.priority,
    });
    setEditTask(t);
    setModalVisible(true);
  };
  const closeModal = () => { setModalVisible(false); setEditTask(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert("Required", "Task title is required."); return; }
    if (!form.assignedTo) { Alert.alert("Required", "Please select a team member to assign the task."); return; }
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assignedTo: form.assignedTo,
        assignedBy: user.id,
        dueDate: form.dueDate.trim() || undefined,
        priority: form.priority,
      };
      if (editTask) { await updateMutation.mutateAsync({ id: editTask.id, ...payload }); }
      else { await createMutation.mutateAsync(payload); }
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save task."); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const handleStatusChange = (task: TaskRecord) => {
    const next: TaskStatus = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "completed" : "pending";
    updateStatusMutation.mutate({ id: task.id, status: next });
  };

  const getMemberName = (id: number) => {
    const m = approvedMembers.find((m) => m.id === id);
    return m ? m.name : `Member #${id}`;
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.headerSub}>{isAdmin ? "Assign & manage team tasks" : "Your assigned tasks"}</Text>
        </View>
        {isAdmin && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={handleExport} activeOpacity={0.8} disabled={exporting}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.addBtnText}>⬇ Export</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
              onPress={openAdd} activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Assign Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, { borderColor: colors.border, backgroundColor: filter === f ? colors.primary : colors.surface }]}
              onPress={() => setFilter(f)} activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, { color: filter === f ? "#fff" : colors.muted }]}>
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredTasks.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.foreground }]}>No tasks found</Text>
            <Text style={[styles.emptySubText, { color: colors.muted }]}>
              {isAdmin ? "Tap \"Assign Task\" to create a new task for your team." : "No tasks assigned to you yet."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Priority bar */}
                <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
                      </View>
                    </View>
                    {isAdmin && (
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn} activeOpacity={0.7}>
                          <Text style={{ fontSize: 16 }}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn} activeOpacity={0.7}>
                          <Text style={{ fontSize: 16 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {item.description ? (
                    <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  <View style={styles.cardMeta}>
                    {isAdmin && (
                      <Text style={[styles.metaText, { color: colors.muted }]}>👤 {getMemberName(item.assignedTo)}</Text>
                    )}
                    {item.dueDate ? (
                      <Text style={[styles.metaText, { color: colors.muted }]}>📅 Due: {item.dueDate}</Text>
                    ) : null}
                    <View style={[styles.priorityTag, { backgroundColor: PRIORITY_COLORS[item.priority] + "20" }]}>
                      <Text style={[styles.priorityTagText, { color: PRIORITY_COLORS[item.priority] }]}>
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                      </Text>
                    </View>
                  </View>

                  {/* Status toggle button for team members */}
                  {!isAdmin && item.status !== "completed" && (
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
                      onPress={() => handleStatusChange(item)} activeOpacity={0.8}
                    >
                      <Text style={[styles.statusBtnText, { color: colors.primary }]}>
                        {item.status === "pending" ? "▶ Mark In Progress" : "✓ Mark Completed"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {item.status === "completed" && item.completedAt && (
                    <Text style={[styles.completedText, { color: colors.success }]}>
                      ✓ Completed {new Date(item.completedAt).toLocaleDateString("en-IN")}
                    </Text>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add/Edit Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editTask ? "Edit Task" : "Assign New Task"}</Text>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Task Title */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Task Title *</Text>
              <TextInput
                value={form.title} onChangeText={set("title")} placeholder="e.g. Prepare mortgage deed for XYZ Bank"
                placeholderTextColor={colors.muted + "80"}
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput
                value={form.description} onChangeText={set("description")} placeholder="Additional details or instructions..."
                placeholderTextColor={colors.muted + "80"} multiline numberOfLines={3}
                style={[styles.fieldInput, styles.fieldInputMulti, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              {/* Assign To */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Assign To *</Text>
              {approvedMembers.length === 0 ? (
                <Text style={[styles.noMembersText, { color: colors.muted }]}>No approved team members available.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberRow}>
                  {approvedMembers.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.memberChip,
                        { borderColor: form.assignedTo === m.id ? colors.primary : colors.border,
                          backgroundColor: form.assignedTo === m.id ? colors.primary + "15" : colors.surface }
                      ]}
                      onPress={() => setForm((f) => ({ ...f, assignedTo: m.id }))} activeOpacity={0.8}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.memberAvatarText}>{m.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.memberChipText, { color: form.assignedTo === m.id ? colors.primary : colors.foreground }]}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Due Date */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                value={form.dueDate} onChangeText={set("dueDate")} placeholder="e.g. 2026-03-15"
                placeholderTextColor={colors.muted + "80"} keyboardType="numeric"
                style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              {/* Priority */}
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
              <View style={styles.priorityRow}>
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      { borderColor: form.priority === p ? PRIORITY_COLORS[p] : colors.border,
                        backgroundColor: form.priority === p ? PRIORITY_COLORS[p] + "20" : colors.surface }
                    ]}
                    onPress={() => setForm((f) => ({ ...f, priority: p }))} activeOpacity={0.8}
                  >
                    <Text style={[styles.priorityBtnText, { color: form.priority === p ? PRIORITY_COLORS[p] : colors.muted }]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saving ? colors.border : colors.primary }]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editTask ? "Update Task" : "Assign Task"}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  body: { flex: 1 },
  filterRow: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, flexDirection: "row", overflow: "hidden" },
  priorityBar: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
  cardTitleRow: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 4, marginLeft: 8 },
  iconBtn: { padding: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  metaText: { fontSize: 12 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityTagText: { fontSize: 11, fontWeight: "600" },
  statusBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, alignItems: "center", borderWidth: 1 },
  statusBtnText: { fontSize: 13, fontWeight: "600" },
  completedText: { fontSize: 12, marginTop: 8, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubText: { fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "95%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalBody: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  fieldInputMulti: { height: 80, textAlignVertical: "top" },
  noMembersText: { fontSize: 13, fontStyle: "italic", marginBottom: 8 },
  memberRow: { marginBottom: 4 },
  memberChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  memberAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  memberChipText: { fontSize: 13, fontWeight: "600" },
  priorityRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  priorityBtnText: { fontSize: 13, fontWeight: "600" },
  saveBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
