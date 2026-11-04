import React from 'react';
import { BLOCKED_DATE_MESSAGE, isBlockedDate } from '../lib/blockedDates';

type PickupDateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const PickupDateInput = ({ onChange, ...props }: PickupDateInputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlockedDate(event.target.value)) {
      alert(BLOCKED_DATE_MESSAGE);
      event.target.value = '';
    }

    onChange?.(event);
  };

  return <input type="date" {...props} onChange={handleChange} />;
};

export default PickupDateInput;
