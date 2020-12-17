import React, { useState } from "react";
import { Input, Button } from 'antd';

const Settings = () => {
  const [text, setText] = useState('')

  return (<div>
    <Input value={text} id="whitelistUrl" placeholder="Whitelist url" onChange={value => setText(value)} />
    <Button>Send</Button>
  </div>
  );
};

export default Settings;