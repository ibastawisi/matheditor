import { User, UserDocument } from "@/types";
import { Dispatch, FC, SetStateAction, memo, useEffect } from "react";
import isEqual from 'fast-deep-equal';
import { Tab, Tabs } from "@mui/material";
import { AccountCircle, Cloud, CloudDone, CloudSync, DoneAll, GroupWork, MobileFriendly, PeopleOutline, Public, Security, SupervisedUserCircle, Workspaces } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';

const DocumentFilterControl: FC<{
  documents: UserDocument[],
  setDocuments: Dispatch<SetStateAction<UserDocument[]>>,
  value: number,
  setValue: (value: number) => void,
  sx?: SxProps<Theme> | undefined
  user?: User,
}> = memo(({ documents, setDocuments, user, value, setValue, sx }) => {
  const options = [
    { key: 0, label: 'Local', icon: <MobileFriendly /> },
    { key: 1, label: 'Cloud', icon: <Cloud /> },
    { key: 2, label: 'Published', icon: <Public /> },
    { key: 3, label: 'Collab', icon: <Workspaces /> },
    { key: 4, label: 'Private', icon: <Security /> },
    { key: 5, label: 'Synced', icon: <CloudDone /> },
    { key: 6, label: 'Out of Sync', icon: <CloudSync /> },
    { key: 7, label: 'Author', icon: <AccountCircle /> },
    { key: 8, label: 'Coauthor', icon: <SupervisedUserCircle /> },
    { key: 9, label: 'Collaborator', icon: <GroupWork /> },
    { key: 10, label: 'Others', icon: <PeopleOutline /> },
  ];

  useEffect(() => {
    filterDocuments(value);
  }, [documents]);

  const handleFilterChange = (optionKey: number) => {
    const newValue = value ^ (1 << optionKey); // Toggle the bit at the specified optionKey
    setValue(newValue);
    filterDocuments(newValue);
  };

  function filterDocuments(value: number) {
    if (value === 0) return setDocuments(documents);
    const filteredDocuments = documents.filter(d => {
      const localDocument = d.local;
      const cloudDocument = d.cloud;
      const isSynced = localDocument && cloudDocument && localDocument.head === cloudDocument.head;
      const isOutofSync = localDocument && cloudDocument && localDocument.head !== cloudDocument.head;
      const isAuthor = cloudDocument?.author.id === user?.id;
      const isCoauthor = cloudDocument?.coauthors.some(coauthor => coauthor.id === user?.id);
      const isCollaborator = cloudDocument?.revisions.some(revision => revision.author.id === user?.id);
      const isOthers = !isAuthor && !isCoauthor && !isCollaborator;
      const showLocal = !!(value & (1 << 0)) && !!localDocument;
      const showCloud = !!(value & (1 << 1)) && !!cloudDocument && !cloudDocument.published && !cloudDocument.collab && !cloudDocument.private;
      const showPublished = !!(value & (1 << 2)) && !!cloudDocument?.published;
      const showCollab = !!(value & (1 << 3)) && !!cloudDocument?.collab;
      const showPrivate = !!(value & (1 << 4)) && !!cloudDocument?.private;
      const showSynced = !!(value & (1 << 5)) && !!isSynced;
      const showOutOfSync = !!(value & (1 << 6)) && !!isOutofSync;
      const showAuthor = !!(value & (1 << 7)) && !!isAuthor;
      const showCoauthor = !!(value & (1 << 8)) && !!isCoauthor;
      const showCollaborator = !!(value & (1 << 9)) && !!isCollaborator && !isAuthor && !isCoauthor;
      const showOthers = !!(value & (1 << 10)) && !!isOthers;

      const shouldShow = showLocal || showCloud || showPublished || showCollab || showPrivate || showSynced || showOutOfSync || showAuthor || showCoauthor || showCollaborator || showOthers;
      return shouldShow;
    });
    setDocuments(filteredDocuments);
  }

  const handleReset = () => {
    setValue(0);
    setDocuments(documents);
  };

  return (
    <Tabs
      value={0}
      variant="scrollable"
      scrollButtons
      allowScrollButtonsMobile
      sx={{
        height: 40,
        minHeight: 40,
        '& .MuiTabs-flexContainer': {
          height: "100%",
          gap: 1,
          alignItems: "center",
        },
        '& .MuiTabs-indicator': {
          display: "none"
        },
        '& .MuiTab-root': {
          height: 32,
          minHeight: 32,
          minWidth: "unset",
          px: 1,
          borderRadius: 4,
          '&.Mui-selected': {
            color: value === 0 ? "primary.contrastText" : "text.secondary",
          },
        },
        ...sx
      }}
    >
      <Tab
        key="all"
        iconPosition="start"
        icon={<DoneAll />}
        label={<span className="MuiTab-label">All</span>}
        onClick={handleReset}
        sx={{
          color: value === 0 ? "primary.contrastText" : "text.secondary",
          backgroundColor: value === 0 ? "primary.main" : "action.selected",
          '& .MuiTab-label': {
            display: { xs: value === 0 ? "block" : "none", sm: "block" }
          },
          '& .MuiTab-iconWrapper': {
            marginRight: { xs: value === 0 ? 1 : 0, sm: 1 }
          }
        }}
      />
      {
        options.map((option) => (
          <Tab
            key={option.key}
            iconPosition="start"
            icon={option.icon}
            label={<span className="MuiTab-label">{option.label}</span>}
            onClick={() => handleFilterChange(option.key)}
            sx={{
              color: value & (1 << option.key) ? "primary.contrastText" : "text.secondary",
              backgroundColor: value & (1 << option.key) ? "primary.main" : "action.selected",
              '& .MuiTab-label': {
                display: { xs: value & (1 << option.key) ? "block" : "none", sm: "block" }
              },
              '& .MuiTab-iconWrapper': {
                marginRight: { xs: value & (1 << option.key) ? 1 : 0, sm: 1 }
              }
            }}
          />
        ))
      }
    </Tabs >
  );
}, isEqual);

export default DocumentFilterControl;