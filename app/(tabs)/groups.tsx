import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import {
  Text,
  useTheme,
  FAB,
  Surface,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { useContacts } from '../../src/context/ContactsContext';
import { Group, Contact } from '../../src/types/contact';
import { AvatarCircle } from '../../src/components/AvatarCircle';
import { EmptyState } from '../../src/components/EmptyState';

interface GroupCardProps {
  group: Group;
  members: Contact[];
  onDelete: () => void;
  onEdit: () => void;
}

function GroupCard({ group, members, onDelete, onEdit }: GroupCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.cardHeader}
      >
        <View style={[styles.groupIcon, { backgroundColor: theme.colors.primary + '18' }]}>
          <MaterialCommunityIcons name="account-group" size={22} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            {group.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
            {members.length} {members.length === 1 ? 'contact' : 'contacts'}
          </Text>
        </View>
        <IconButton icon="pencil-outline" size={18} onPress={onEdit} iconColor={theme.colors.onSurfaceVariant} />
        <IconButton icon="trash-can-outline" size={18} onPress={onDelete} iconColor={theme.colors.error} />
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.5 }}
        />
      </Pressable>

      {expanded && members.length > 0 && (
        <>
          <Divider style={{ marginHorizontal: 16 }} />
          <View style={styles.memberList}>
            {members.map((c) => (
              <Pressable
                key={c.id}
                style={styles.memberRow}
                onPress={() => router.push(`/contact/${c.id}`)}
              >
                <AvatarCircle name={c.fullName} size={34} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                    {c.fullName}
                  </Text>
                  {c.phones[0] && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {c.phones[0].number}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Surface>
  );
}

interface GroupDialogProps {
  visible: boolean;
  initial: { name: string; contactIds: string[] } | null;
  allContacts: Contact[];
  onDismiss: () => void;
  onSave: (name: string, contactIds: string[]) => void;
}

function GroupDialog({ visible, initial, allContacts, onDismiss, onSave }: GroupDialogProps) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.contactIds ?? []));

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setSelected(new Set(initial?.contactIds ?? []));
    }
  }, [visible, initial]);

  function toggleContact(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxHeight: '85%' }}>
        <Dialog.Title>{initial?.name ? 'Edit Group' : 'New Group'}</Dialog.Title>
        <Dialog.ScrollArea>
          <View style={{ paddingVertical: 8, gap: 12 }}>
            <TextInput
              label="Group name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoFocus
            />
            <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              MEMBERS
            </Text>
            {allContacts.map((c) => (
              <Pressable
                key={c.id}
                style={styles.dialogRow}
                onPress={() => toggleContact(c.id)}
              >
                <AvatarCircle name={c.fullName} size={36} />
                <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }}>
                  {c.fullName}
                </Text>
                <MaterialCommunityIcons
                  name={selected.has(c.id) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                  size={22}
                  color={selected.has(c.id) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ))}
          </View>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={() => onSave(name.trim(), Array.from(selected))}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default function GroupsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { groups, contacts, saveGroup, deleteGroup, getContactsByGroup } = useContacts();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  function handleEdit(group: Group) {
    setEditingGroup(group);
    setDialogVisible(true);
  }

  function handleNew() {
    setEditingGroup(null);
    setDialogVisible(true);
  }

  async function handleDelete(group: Group) {
    Alert.alert(
      'Delete Group',
      `Remove the "${group.name}" group? Contacts will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGroup(group.id),
        },
      ]
    );
  }

  async function handleSave(name: string, contactIds: string[]) {
    const now = Math.floor(Date.now() / 1000);
    await saveGroup({
      id: editingGroup?.id ?? uuidv4(),
      name,
      contactIds,
      updatedAt: now,
      deleted: false,
      synced: false,
    });
    setDialogVisible(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, paddingTop: insets.top + 8, borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
          Groups
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
          {groups.length} {groups.length === 1 ? 'group' : 'groups'}
        </Text>
      </View>

      {groups.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="No groups yet"
          subtitle="Organise your contacts into groups for easy access"
          actionLabel="Create Group"
          onAction={handleNew}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              members={getContactsByGroup(item.id)}
              onDelete={() => handleDelete(item)}
              onEdit={() => handleEdit(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 70 }]}
        color={theme.colors.onPrimary}
        onPress={handleNew}
      />

      <GroupDialog
        visible={dialogVisible}
        initial={editingGroup ? { name: editingGroup.name, contactIds: editingGroup.contactIds } : null}
        allContacts={contacts}
        onDismiss={() => setDialogVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  groupIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberList: { padding: 12, gap: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 4 },
  dialogRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  fab: { position: 'absolute', right: 20, borderRadius: 28 },
});
