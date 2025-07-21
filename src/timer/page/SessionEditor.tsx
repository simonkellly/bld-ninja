import { DialogDescription } from '@radix-ui/react-dialog';
import { useStore } from '@tanstack/react-store';
import { ChevronDown, Trash } from 'lucide-react';
import { useState } from 'react';
import { ActionButton, ActionIcon } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Session, SESSION_TYPES } from '@/lib/db';
import {
  setActiveSession,
  deleteSession,
  createSession,
  SessionStore,
} from '../sessionStore';

function DeleteSessionDialog({
  session,
  onClose,
}: {
  session: Session | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{session?.name}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              deleteSession(session!);
              onClose();
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionType, setNewSessionType] =
    useState<(typeof SESSION_TYPES)[number]>('3BLD');

  const handleClose = () => {
    setNewSessionName('');
    setNewSessionType('3BLD');
    onOpenChange(false);
  };

  const handleCreate = () => {
    if (newSessionName.trim()) {
      createSession({
        name: newSessionName.trim(),
        type: newSessionType,
      });
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>
            Create a new session to track your solves.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Session Name"
            value={newSessionName}
            onChange={e => setNewSessionName(e.target.value)}
          />
          <Select
            value={newSessionType}
            onValueChange={(value: (typeof SESSION_TYPES)[number]) =>
              setNewSessionType(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {SESSION_TYPES.map(t => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!newSessionName.trim()}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SessionEditor() {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [popupDeleteSession, setPopupDeleteSession] = useState<Session | null>(
    null
  );

  const sessions = useStore(SessionStore, state => state.sessions);
  const activeSession = useStore(SessionStore, state => state.activeSession);

  if (!activeSession || !sessions) return <></>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <ActionButton className="gap-2 sm:aspect-auto sm:px-2">
            <ActionIcon icon={ChevronDown} />
            {activeSession.name} ({activeSession.type})
          </ActionButton>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session Manager</DialogTitle>
            <DialogDescription>Current: {activeSession.name}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setCreateOpen(true)} className="mb-2">
            Create New Session
          </Button>
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="py-1 px-2">Name</TableHead>
                <TableHead className="py-1 px-2">Type</TableHead>
                <TableHead className="py-1 px-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => (
                <TableRow
                  key={index}
                  className={`cursor-pointer hover:bg-muted/50 ${activeSession.name === session.name ? 'bg-muted' : ''}`}
                  onClick={() => setActiveSession(session)}
                >
                  <TableCell className="py-1 px-2">{session.name}</TableCell>
                  <TableCell className="py-1 px-2">{session.type}</TableCell>
                  <TableCell
                    className="py-1 px-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex gap-0.5">
                      <Button
                        disabled={sessions.length === 1}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setPopupDeleteSession(session)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <DeleteSessionDialog
        session={popupDeleteSession}
        onClose={() => setPopupDeleteSession(null)}
      />

      <CreateSessionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
