import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("Studio interactions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uploads csv file and switches format", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Upload dataset") as HTMLInputElement;
    const file = new File(["doc_id,text\nd1,Hello"], "dataset.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue("doc_id,text\nd1,Hello") });
    await user.upload(input, file);

    expect(await screen.findByText("Loaded dataset.csv")).toBeTruthy();
    expect((screen.getByLabelText("Dataset text") as HTMLTextAreaElement).value).toContain("d1,Hello");
  });

  it("persists rubric editor state in local storage", () => {
    const { unmount } = render(<App />);

    const rubricArea = screen.getByLabelText("Rubric editor");
    fireEvent.change(rubricArea, { target: { value: '{"criteria":[{"id":"persist"}]}' } });

    unmount();
    render(<App />);

    expect(screen.getByDisplayValue('{"criteria":[{"id":"persist"}]}')).toBeTruthy();
  });

  it("exports compiler bundle artifacts", async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:mock"), writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    await user.click(screen.getByText("Export Compiler Bundle"));

    expect(await screen.findByText(/Exported \d+ artifacts/)).toBeTruthy();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });
});
