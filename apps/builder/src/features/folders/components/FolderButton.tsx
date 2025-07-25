import { ConfirmModal } from "@/components/ConfirmModal";
import { FolderIcon, MoreVerticalIcon } from "@/components/icons";
import { trpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";
import {
  Alert,
  AlertIcon,
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
  VStack,
  WrapItem,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { T, useTranslate } from "@tolgee/react";
import type { Prisma } from "@typebot.io/prisma/types";
import { useRouter } from "next/router";
import React, { memo, useMemo } from "react";
import { useTypebotDnd } from "../TypebotDndProvider";

type Props = {
  folder: Prisma.DashboardFolder;
  index: number;
  onFolderDeleted: () => void;
  onFolderRenamed: () => void;
};

const FolderButton = ({
  folder,
  index,
  onFolderDeleted,
  onFolderRenamed,
}: Props) => {
  const { t } = useTranslate();
  const router = useRouter();
  const { draggedTypebot, setMouseOverFolderId, mouseOverFolderId } =
    useTypebotDnd();
  const isTypebotOver = useMemo(
    () => draggedTypebot && mouseOverFolderId === folder.id,
    [draggedTypebot, folder.id, mouseOverFolderId],
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { mutate: deleteFolder } = useMutation(
    trpc.folders.deleteFolder.mutationOptions({
      onError: (error) => {
        toast({ description: error.message });
      },
      onSuccess: onFolderDeleted,
    }),
  );

  const { mutate: updateFolder } = useMutation(
    trpc.folders.updateFolder.mutationOptions({
      onError: (error) => {
        toast({ description: error.message });
      },
      onSuccess: onFolderRenamed,
    }),
  );

  const onRenameSubmit = async (newName: string) => {
    if (newName === "" || newName === folder.name) return;
    updateFolder({
      workspaceId: folder.workspaceId,
      folderId: folder.id,
      folder: {
        name: newName,
      },
    });
  };

  const handleClick = () => {
    router.push(`/typebots/folders/${folder.id}`);
  };

  const handleMouseEnter = () => setMouseOverFolderId(folder.id);
  const handleMouseLeave = () => setMouseOverFolderId(undefined);
  return (
    <Button
      as={WrapItem}
      style={{ width: "225px", height: "270px" }}
      paddingX={6}
      whiteSpace={"normal"}
      pos="relative"
      cursor="pointer"
      variant="outline"
      bg={useColorModeValue("white", "gray.900")}
      colorScheme={isTypebotOver || draggedTypebot ? "orange" : "gray"}
      borderWidth={isTypebotOver ? "2px" : "1px"}
      transition={"border-width 0.1s ease"}
      justifyContent="center"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<MoreVerticalIcon />}
          aria-label={`Show ${folder.name} menu`}
          onClick={(e) => e.stopPropagation()}
          colorScheme="gray"
          variant="outline"
          size="sm"
          pos="absolute"
          top="5"
          right="5"
        />
        <MenuList>
          <MenuItem
            color="red"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {t("delete")}
          </MenuItem>
        </MenuList>
      </Menu>
      <VStack spacing="4">
        <FolderIcon
          fontSize={50}
          color={useColorModeValue("blue.500", "blue.400")}
        />
        <Editable
          defaultValue={folder.name === "" ? "New folder" : folder.name}
          fontSize="18"
          onClick={(e) => e.stopPropagation()}
          onSubmit={onRenameSubmit}
          startWithEditView={index === 0 && folder.name === ""}
        >
          <EditablePreview
            _hover={{
              bg: useColorModeValue("gray.100", "gray.700"),
            }}
            px="2"
            textAlign="center"
          />
          <EditableInput textAlign="center" />
        </Editable>
      </VStack>

      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        confirmButtonLabel={t("delete")}
        message={
          <Stack spacing="4">
            <Text>
              <T
                keyName="folders.folderButton.deleteConfirmationMessage"
                params={{
                  strong: <strong>{folder.name}</strong>,
                }}
              />
            </Text>
            <Alert status="warning">
              <AlertIcon />
              {t("folders.folderButton.deleteConfirmationMessageWarning")}
            </Alert>
          </Stack>
        }
        title={`${t("delete")} ${folder.name}?`}
        onConfirm={() =>
          deleteFolder({
            workspaceId: folder.workspaceId,
            folderId: folder.id,
          })
        }
        confirmButtonColor="red"
      />
    </Button>
  );
};

export const ButtonSkeleton = () => (
  <Button
    as={VStack}
    style={{ width: "225px", height: "270px" }}
    paddingX={6}
    whiteSpace={"normal"}
    pos="relative"
    cursor="pointer"
    variant="outline"
  >
    <VStack spacing="6" w="full">
      <SkeletonCircle boxSize="45px" />
      <SkeletonText noOfLines={2} w="full" />
    </VStack>
  </Button>
);

export default memo(
  FolderButton,
  (prev, next) =>
    prev.folder.id === next.folder.id &&
    prev.index === next.index &&
    prev.folder.name === next.folder.name,
);
