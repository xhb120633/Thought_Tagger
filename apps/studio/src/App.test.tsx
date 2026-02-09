import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("Studio guided UI", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uploads csv file and surfaces loaded status", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Upload dataset") as HTMLInputElement;
    const file = new File(["doc_id,text\nd1,Hello"], "dataset.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue("doc_id,text\nd1,Hello") });
    await user.upload(input, file);

    expect((screen.getByLabelText("Dataset text") as HTMLTextAreaElement).value).toContain("d1,Hello");
  });

  it("shows dataset validation errors for duplicate doc_id", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Dataset text"), {
      target: { value: '{"doc_id":"d1","text":"x"}\n{"doc_id":"d1","text":"y"}' }
    });

    expect(screen.getByText("Dataset errors:")).toBeTruthy();
    expect(screen.getByText("Duplicate doc_id: d1")).toBeTruthy();
  });

  it("exports bundle artifacts", async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:mock"), writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    await user.click(screen.getByText("Export Bundle"));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });
});
