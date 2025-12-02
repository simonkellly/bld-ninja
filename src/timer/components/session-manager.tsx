import { Button, ButtonGroup, Divider, ModalBody, Modal, ModalContent, ModalFooter, Popover, PopoverContent, PopoverTrigger, useDisclosure, ModalHeader, Input, Select, SelectItem } from "@heroui/react";
import { SessionStore, createSession, setActiveSession, deleteSession, archiveSession } from "../logic/session-store";
import { useStore } from "@tanstack/react-store";
import { Check, Trash, Plus, Archive } from "lucide-react";
import { useState } from "react";

const TIMER_MODES = ['3BLD', 'Edges', 'Corners'] as const;

function CreateSessionModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [sessionName, setSessionName] = useState("");
  const [sessionType, setSessionType] = useState<string>("3BLD");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    if (sessionName.trim().toLowerCase().includes('archive')) return;
    
    setIsCreating(true);
    try {
      await createSession({
        name: sessionName.trim(),
        type: sessionType as typeof TIMER_MODES[number],
        lastUsed: Date.now(),
      });
      
      // Reset form and close modal
      setSessionName("");
      setSessionType("3BLD");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = sessionName.trim().length > 0 && !sessionName.trim().toLowerCase().includes('archive');
  const hasArchiveInName = sessionName.trim().toLowerCase().includes('archive');

  return (
    <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Create New Session</ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                label="Session Name"
                placeholder="Enter session name"
                variant="bordered"
                value={sessionName}
                onValueChange={setSessionName}
                isRequired
                isInvalid={hasArchiveInName}
                errorMessage={hasArchiveInName ? "Session names cannot contain 'Archive'" : ""}
              />
                             <Select
                 label="Timer Mode"
                 placeholder="Select a timer mode"
                 variant="bordered"
                 selectedKeys={[sessionType]}
                 onSelectionChange={(keys) => {
                   const selected = Array.from(keys)[0] as string;
                   setSessionType(selected);
                 }}
                 isRequired
               >
                 {TIMER_MODES.map((mode) => (
                   <SelectItem key={mode}>
                     {mode}
                   </SelectItem>
                 ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleCreate}
                isDisabled={!isFormValid || isCreating}
                isLoading={isCreating}
                startContent={!isCreating ? <Plus className="w-4 h-4" /> : null}
              >
                Create Session
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default function SessionManager() {
  const currentSession = useStore(SessionStore, state => state.activeSession);
  const sessions = useStore(SessionStore, state => state.sessions);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();

  const handleSwitchSession = (session: any) => {
    if (session.id !== currentSession.id) {
      setActiveSession(session);
    }
  };

  const handleDeleteSession = (session: any) => {
    deleteSession(session);
  };

  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button variant="faded" size="lg" fullWidth className="h-20 font-medium">
          {currentSession.name} ({currentSession.type})
        </Button>
      </PopoverTrigger>
      <PopoverContent title="Session Manager">
        {(titleProps) => (
          <div className="px-1 py-2 w-80">
            <h3 className="text-small font-bold" {...titleProps}>
              Session Manager
            </h3>
            {sessions.map(session => (
              <ButtonGroup fullWidth className="pt-2"  size="md" variant="solid" key={session.id ?? ''}>
                <Button 
                  fullWidth 
                  startContent={session.id === currentSession.id ? <Check className="w-4 h-4" /> : null}
                  onPress={() => handleSwitchSession(session)}
                >
                  {session.name} ({session.type})
                </Button>
                <Button
                  isIconOnly
                  color="secondary"
                  onPress={() => archiveSession(session)}
                  isDisabled={session.name.includes('Archive')}
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button 
                  isIconOnly 
                  color="danger"
                  onPress={() => handleDeleteSession(session)}
                  isDisabled={sessions.length <= 1}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </ButtonGroup>
            ))}
           <Divider className="my-2" />
           <Button size="md" variant="shadow" fullWidth color="primary" onPress={() => {
            onCreateOpen();
           }}>
            Create Session
           </Button>
           <CreateSessionModal isOpen={isCreateOpen} onOpenChange={onCreateOpenChange} />

          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}