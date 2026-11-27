import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

function ModalHarness({ onClose }: { onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>Open dialog</button>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setIsOpen(false);
        }}
        title="Confirm action"
        footer={<button type="button">Confirm</button>}
      >
        <button type="button">Cancel</button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("traps keyboard focus, closes with Escape and restores focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    const opener = screen.getByRole("button", { name: "Open dialog" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Confirm action" });
    const closeButton = screen.getByRole("button", { name: "Close dialog" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Confirm" });

    expect(document.activeElement).toBe(closeButton);
    confirmButton.focus();
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(confirmButton);
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(opener);
    expect(cancelButton.isConnected).toBe(false);
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Information">Details</Modal>);

    await user.click(screen.getByRole("dialog").parentElement!);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
