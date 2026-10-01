"use client"
import { Badge, Box, IconButton, SwipeableDrawer, Tab, Tabs, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppStore } from '@/store';
import { useEffect, useState } from 'react';

export interface AppDrawerTab {
  value: string;
  label: string;
  icon: React.ReactElement;
  badge?: number;
  content: React.ReactNode;
}

const AppDrawer: React.FC<{ title: string, tabs: AppDrawerTab[], onChange?: (value: string) => void }> = ({ title, tabs, onChange }) => {
  const open = useAppStore(state => state.drawer);
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const handleToggle = () => { toggleDrawer(); }
  const [selected, setSelected] = useState(tabs[0]?.value);
  // a tab can go away, like the page setup before the editor is ready
  const activeTab = tabs.find(tab => tab.value === selected) ?? tabs[0];

  useEffect(() => {
    return () => { toggleDrawer(false); }
  }, []);

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onOpen={handleToggle}
      onClose={handleToggle}
      sx={{ displayPrint: 'none' }}
      slotProps={{ paper: { sx: { width: 360, maxWidth: '100vw', overflow: 'hidden' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1, flexShrink: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton aria-label="Close" onClick={handleToggle} sx={{ ml: "auto", mr: -1 }}><Close /></IconButton>
      </Box>
      <Tabs
        value={activeTab?.value ?? false}
        onChange={(_, value) => { setSelected(value); onChange?.(value); }}
        variant="fullWidth"
        aria-label={title}
        sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            id={`drawer-tab-${tab.value}`}
            aria-controls={`drawer-tabpanel-${tab.value}`}
            icon={tab.badge ? <Badge badgeContent={tab.badge} color="secondary">{tab.icon}</Badge> : tab.icon}
            sx={{ minHeight: 64, minWidth: 0, px: 1, textTransform: 'none' }}
          />
        ))}
      </Tabs>
      {activeTab && <Box
        role="tabpanel"
        id={`drawer-tabpanel-${activeTab.value}`}
        aria-labelledby={`drawer-tab-${activeTab.value}`}
        sx={{ flex: 1, overflowY: 'auto', p: 2 }}
      >
        {activeTab.content}
      </Box>}
    </SwipeableDrawer>
  );
}

export default AppDrawer;
