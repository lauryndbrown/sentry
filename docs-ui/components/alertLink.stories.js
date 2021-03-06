import React from 'react';
import {storiesOf} from '@storybook/react';
import {withInfo} from '@storybook/addon-info';

import AlertLink from 'app/components/alertLink';

storiesOf('UI|Alerts/AlertLink', module)
  .add(
    'default',
    withInfo('A way to loudly link between different parts of the application')(() => [
      <AlertLink to="/settings/account/notifications" key="1">
        Check out the notifications settings panel.
      </AlertLink>,
      <AlertLink to="/settings/account/notifications" priority="error" key="2">
        Do not forget to read the docs ya dum dum!
      </AlertLink>,
      <AlertLink to="/settings/account/notifications" priority="info" key="3">
        Install this thing or else!
      </AlertLink>,
      <AlertLink to="/settings/account/notifications" priority="success" key="4">
        Gj you did it. Now go here.
      </AlertLink>,
      <AlertLink to="/settings/account/notifications" priority="muted" key="5">
        I am saying nothing, ok?
      </AlertLink>,
    ])
  )
  .add(
    'with an icon',
    withInfo('You can optionally pass an icon src')(() => [
      <AlertLink to="/settings/account/notifications" icon="icon-mail" key="1">
        Check out the notifications settings panel.
      </AlertLink>,
      <AlertLink
        to="/settings/account/notifications"
        icon="icon-docs"
        priority="error"
        key="2"
      >
        Do not forget to read the docs ya dum dum!
      </AlertLink>,
      <AlertLink
        to="/settings/account/notifications"
        icon="icon-stack"
        priority="info"
        key="3"
      >
        Install this thing or else!
      </AlertLink>,
      <AlertLink
        to="/settings/account/notifications"
        icon="icon-star"
        priority="success"
        key="4"
      >
        Gj you did it. Now go here.
      </AlertLink>,
      <AlertLink
        to="/settings/account/notifications"
        icon="icon-generic-box"
        priority="muted"
        key="5"
      >
        I am saying nothing, ok?
      </AlertLink>,
    ])
  );
