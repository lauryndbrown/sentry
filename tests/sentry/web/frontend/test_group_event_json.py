from __future__ import absolute_import

import json

from datetime import timedelta
from django.utils import timezone
from exam import fixture

from sentry.testutils import TestCase


class GroupEventJsonTest(TestCase):
    @fixture
    def path(self):
        return u'/organizations/{}/issues/{}/events/{}/json/'.format(
            self.organization.slug,
            self.event.group_id,
            self.event.event_id,
        )

    def test_does_render(self):
        self.login_as(self.user)
        min_ago = (timezone.now() - timedelta(minutes=1)).isoformat()[:19]
        self.event = self.store_event(
            data={
                'fingerprint': ['group1'],
                'timestamp': min_ago,
            },
            project_id=self.project.id,
        )
        resp = self.client.get(self.path)
        assert resp.status_code == 200
        assert resp['Content-Type'] == 'application/json'
        data = json.loads(resp.content.decode('utf-8'))
        assert data['event_id'] == self.event.event_id
