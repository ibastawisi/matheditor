import { User, UserDocument } from "@/types";
import { FC, useState } from "react";
import { Tab, Tabs } from "@mui/material";
import { AccountCircle, Cloud, CloudDone, CloudSync, DoneAll, GroupWork, MobileFriendly, PeopleOutline, Public, Security, SupervisedUserCircle, Workspaces } from "@mui/icons-material";
import { SxProps, Theme } from '@mui/material/styles';

export const filterDocuments = (documents: UserDocument[], user: User | undefined, value: number) => {
  if (value === 0) return documents;
  const filteredDocuments = documents.filter(d => {
    const localDocument = d.local;
    const cloudDocument = d.cloud;
    const isLocalOnly = localDocument && !cloudDocument;
    const isCloudOnly = cloudDocument && !localDocument && !cloudDocument.published && !cloudDocument.collab && !cloudDocument.private;
    const isSynced = localDocument && cloudDocument && localDocument.head === cloudDocument.head;
    const isOutofSync = localDocument && cloudDocument && localDocument.head !== cloudDocument.head;
    const isAuthor = cloudDocument?.author.id === user?.id;
    const isCoauthor = cloudDocument?.coauthors.some(coauthor => coauthor.id === user?.id);
    const isCollaborator = cloudDocument?.revisions.some(revision => revision.author.id === user?.id);
    const isOthers = !isLocalOnly && !isAuthor && !isCoauthor && !isCollaborator;
    const showLocal = !!(value & (1 << 0)) && !!localDocument;
    const showCloud = !!(value & (1 << 1)) && !!isCloudOnly;
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
  return filteredDocuments;
}

const DocumentFilterControl: FC<{
  value: number,
  setValue: (value: number) => void,
  sx?: SxProps<Theme> | undefined
}> = ({ value, setValue, sx }) => {
  const [tabsValue, setTabsValue] = useState(value === 0 ? 0 : Math.floor(Math.log2(value) + 1));
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

  const handleFilterChange = (optionKey: number) => {
    const newValue = value ^ (1 << optionKey);
    setValue(newValue);
    const tabsValue = newValue === 0 ? 0 : Math.floor(Math.log2(newValue) + 1);
    setTabsValue(tabsValue);
  };

  const handleReset = () => {
    setValue(0);
    setTabsValue(0);
  };

  return (
    <Tabs
      value={tabsValue}
      variant="scrollable"
      scrollButtons
      allowScrollButtonsMobile
      sx={{
        height: 40,
        minHeight: 40,
        '& .MuiTabScrollButton-root.Mui-disabled': {
          opacity: 1,
          color: "text.disabled"
        },
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
            color: "primary.contrastText",
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
          "& .MuiTab-icon": {
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
              "& .MuiTab-icon": {
                marginRight: { xs: value & (1 << option.key) ? 1 : 0, sm: 1 }
              }
            }}
          />
        ))
      }
    </Tabs >
  );
};

export default DocumentFilterControl;