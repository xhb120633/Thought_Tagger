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
    fireEvent.change(rubricArea, {
      target: {
        value: '{"questions":[{"question_id":"persist","prompt":"Persist this rubric","response_type":"free_text"}]}'
      }
    });

    unmount();
    render(<App />);

    expect(
      screen.getByDisplayValue(
        '{"questions":[{"question_id":"persist","prompt":"Persist this rubric","response_type":"free_text"}]}'
      )
    ).toBeTruthy();
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

  it("includes edited rubric questions in exported studio bundle", async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn((blob: Blob) => {
        blobs.push(blob);
        return `blob:mock-${blobs.length}`;
      }),
      writable: true
    });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.change(screen.getByLabelText("Rubric editor"), {
      target: {
        value: JSON.stringify({
          questions: [
            {
              question_id: "q_custom",
              prompt: "Custom rubric question",
              response_type: "free_text"
            }
          ]
        })
      }
    });

    await user.click(screen.getByText("Export Compiler Bundle"));

    const studioBundleBlob = blobs[blobs.length - 1];
    const studioBundleText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(studioBundleBlob);
    });
    const parsedBundle = JSON.parse(studioBundleText) as {
      spec: { questions?: Array<{ question_id: string; prompt: string }> };
      rubric_config: { questions: Array<{ question_id: string; prompt: string }> };
    };

    expect(parsedBundle.spec.questions?.[0].question_id).toBe("q_custom");
    expect(parsedBundle.spec.questions?.[0].prompt).toBe("Custom rubric question");
    expect(parsedBundle.rubric_config.questions[0].question_id).toBe("q_custom");
  });

  it("blocks export and shows clear error for invalid rubric JSON", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Rubric editor"), {
      target: { value: "{" }
    });

    expect(screen.getByText("Error: Rubric must be valid JSON")).toBeTruthy();
    expect(screen.queryByText("Export Compiler Bundle")).toBeNull();
  });
});
