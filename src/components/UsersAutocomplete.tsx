import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { CloudDocument, User } from '@/types';
import { useSelector } from '@/store';
import { Chip } from '@mui/material';
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
  const handleChange = (event: React.SyntheticEvent, newValue: (User | string)[]) => {
    onChange(newValue);
  };
  const user = useSelector(state => state.user);
  const documents = useSelector(state => state.documents);
  const cloudDocuments = documents.filter(d => d.cloud).map(d => d.cloud) as CloudDocument[];

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
      getOptionLabel={(option) => {
        if (typeof option === 'string') {
          return option;
        }
        return option.email;
      }}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props as any;
        return <li key={key} {...rest}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {option.name}
        </li>
      }}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => {
          const email = typeof option === 'string' ? option : option.email;
          return <Chip {...getTagProps({ index })} key={email} label={email} />
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

