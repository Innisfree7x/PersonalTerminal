import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen, userEvent } from '@/tests/utils/test-utils';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarProvider';

function Probe() {
  const { isCollapsed, toggleCollapsed } = useSidebar();
  return (
    <div>
      <span>{isCollapsed ? 'collapsed' : 'expanded'}</span>
      <button onClick={toggleCollapsed}>toggle</button>
    </div>
  );
}

describe('SidebarProvider', () => {
  test('teilt den Sidebar-Status ueber Context', async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>,
    );

    expect(screen.getByText('expanded')).toBeInTheDocument();

    await user.click(screen.getByText('toggle'));

    expect(screen.getByText('collapsed')).toBeInTheDocument();
  });
});
