import { useState } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/app-auth-context";
import { useRouter } from "expo-router";

type TabType = "pending" | "all";

export default function AdminPanelScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user } = useAppAuth();
  const [tab, setTab] = useState<TabType>("pending");

  const pendingQuery = trpc.team.pendingApprovals.useQuery(
    { token: token ?? "" },
    { enabled: !!token && user?.role === "admin" },
  );

  const allMembersQuery = trpc.team.allMembers.useQuery(
    { token: token ?? "" },
    { enabled: !!token && user?.role === "admin" },
  );

  const approveMutation = trpc.team.approveUser.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      allMembersQuery.refetch();
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <IconSymbol name="lock.fill" size={40} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Admin Access Only</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>You do not have permission to view this page.</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const handleApprove = (userId: number, name: string, action: "approve" | "reject") => {
    Alert.alert(
      action === "approve" ? "Approve Member" : "Reject Member",
      `${action === "approve" ? "Approve" : "Reject"} access for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approve" ? "Approve" : "Reject",
          style: action === "reject" ? "destructive" : "default",
          onPress: () => approveMutation.mutate({ token: token!, userId, action }),
        },
      ],
    );
  };

  const pendingCount = pendingQuery.data?.length ?? 0;

  const renderPendingItem = ({ item }: { item: any }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.memberAvatar, { backgroundColor: colors.warning + "20" }]}>
        <Text style={[styles.memberAvatarText, { color: colors.warning }]}>
          {item.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.memberEmail, { color: colors.muted }]}>{item.email}</Text>
        <Text style={[styles.memberDate, { color: colors.muted }]}>
          Registered: {new Date(item.createdAt).toLocaleDateString("en-IN")}
        </Text>
      </View>
      <View style={styles.actionBtns}>
        <TouchableOpacity
          style={[styles.approveBtn, { backgroundColor: colors.success }]}
          onPress={() => handleApprove(item.id, item.name, "approve")}
          activeOpacity={0.85}
        >
          <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectBtn, { borderColor: colors.error }]}
          onPress={() => handleApprove(item.id, item.name, "reject")}
          activeOpacity={0.85}
        >
          <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    if (status === "approved") return colors.success;
    if (status === "rejected") return colors.error;
    return colors.warning;
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <View style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "15" }]}>
        <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
          {item.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.memberEmail, { color: colors.muted }]}>{item.email}</Text>
        <View style={styles.memberBadgeRow}>
          <View style={[styles.roleBadge, { backgroundColor: item.role === "admin" ? colors.primary + "20" : colors.surface }]}>
            <Text style={[styles.roleBadgeText, { color: item.role === "admin" ? colors.primary : colors.muted }]}>
              {item.role === "admin" ? "Admin" : "Member"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const isLoading = tab === "pending" ? pendingQuery.isLoading : allMembersQuery.isLoading;
  const data = tab === "pending" ? pendingQuery.data ?? [] : allMembersQuery.data ?? [];

  return (
    <ScreenContainer containerClassName="bg-primary">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage team members</Text>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === "pending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab("pending")}
          >
            <Text style={[styles.tabText, { color: tab === "pending" ? colors.primary : colors.muted }]}>
              Pending {pendingCount > 0 ? `(${pendingCount})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "all" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab("all")}
          >
            <Text style={[styles.tabText, { color: tab === "all" ? colors.primary : colors.muted }]}>
              All Members
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : data.length === 0 ? (
          <View style={styles.center}>
            <IconSymbol name="person.2.fill" size={40} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {tab === "pending" ? "No Pending Requests" : "No Members Yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {tab === "pending" ? "All caught up! No new registration requests." : "Team members will appear here once they register."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={tab === "pending" ? renderPendingItem : renderMemberItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => tab === "pending" ? pendingQuery.refetch() : allMembersQuery.refetch()}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18,
  },
  backArrow: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  content: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -8 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  listContent: { padding: 16, gap: 12 },
  memberCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 16, fontWeight: "800" },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  memberEmail: { fontSize: 12, marginBottom: 4 },
  memberDate: { fontSize: 11 },
  memberBadgeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: "600" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  actionBtns: { flexDirection: "row", gap: 8, marginTop: 12 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  rejectBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  rejectBtnText: { fontSize: 13, fontWeight: "700" },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
