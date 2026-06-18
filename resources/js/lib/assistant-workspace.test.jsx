import { describe, expect, it } from 'vitest';

import { getSidebarPrimaryItems } from './assistant-workspace';

describe('getSidebarPrimaryItems', () => {
    it('orders Problems before Arena', () => {
        const ids = getSidebarPrimaryItems('en').map((item) => item.id);

        expect(ids[0]).toBe('problems');
        expect(ids[1]).toBe('arena');
        expect(ids.indexOf('problems')).toBeLessThan(ids.indexOf('arena'));
    });
});
