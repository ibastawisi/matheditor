import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { CloudDocument, User } from '@/types';
import { actions, useDispatch, useSelector } from '@/store';
import { Avatar, Chip, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function UsersAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  sx,
}: {
  label?: string;
  placeholder?: string;
  value: (User | string)[];
  onChange: (users: (User | string)[]) => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const documents = useSelector(state => state.documents);
  const cloudDocuments = documents.filter(d => !!d.cloud).map(d => d.cloud) as CloudDocument[];

  const users: User[] = cloudDocuments.reduce((users, document) => {
    const author = document.author;
    if (!users.some(u => u.id === author.id) && author.id !== user?.id) users.push(author);
    const coauthors = document.coauthors;
    coauthors.forEach(coauthor => {
      if (!users.some(u => u.id === coauthor.id) && coauthor.id !== user?.id) users.push(coauthor);
    });
    const revisions = document.revisions;
    const collaborators = revisions.reduce((acc, rev) => {
      if (rev.author.id !== author.id &&
        !coauthors.some(u => u.id === rev.author.id) &&
        !acc.find(u => u.id === rev.author.id)) acc.push(rev.author);
      return acc;
    }, [] as User[]);
    collaborators.forEach(collaborator => {
      if (!users.some(u => u.id === collaborator.id) && collaborator.id !== user?.id) users.push(collaborator);
    });
    return users;
  }, [] as User[]);

  const userValue = value.map(u => typeof u === "string" ? users.find(user => user.email === u) || u : u);
  const handleChange = (event: React.SyntheticEvent, newValue: (User | string)[]) => {
    const invalidEmails = newValue.filter(u => typeof u === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u));
    if (invalidEmails.length > 0) return dispatch(actions.announce({ message: { title: "Invalid Email Address", subtitle: "Please enter a valid email address." } }));
    onChange(newValue);
  };

  return (
    <Autocomplete
      freeSolo
      multiple
      size='small'
      id="users-autocomplete"
      options={users}
      disableCloseOnSelect
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      filterOptions={(options, params) => {
        const filtered = options.filter(option => {
          return option.email.toLowerCase().includes(params.inputValue.toLowerCase()) || option.name.toLowerCase().includes(params.inputValue.toLowerCase());
        });
        return filtered;
      }}
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return option.email;
      }}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props as any;
        return <ListItem
          dense
          key={key}
          secondaryAction={<Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            checked={selected}
          />}
          {...rest}
        >
          <ListItemAvatar>
            <Avatar alt={option.name} src={option.image || undefined} />
          </ListItemAvatar>
          <ListItemText primary={option.name} secondary={option.email} />
        </ListItem>
      }}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => {
          const name = typeof option === 'string' ? option : option.name;
          const email = typeof option === 'string' ? option : option.email;
          const altText = typeof option === 'string' ? option : option.name;
          const image = typeof option === 'string' ? undefined : option.image || undefined;
          return <Chip {...getTagProps({ index })} key={email} label={name} avatar={<Avatar alt={altText} src={image} />} />
        })
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} sx={sx} />
      )}

      value={userValue}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}

