import json
import os

def merge_transcripts():
    # Đi ngược lên 1 cấp để tìm folder raw_transcripts ở gốc project
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    output_dir = os.path.join(project_root, "raw_transcripts")
    
    final_dataset = []
    
    if not os.path.exists(output_dir):
        print(f"Error: Thư mục {output_dir} không tồn tại!")
        return

    files = [f for f in os.listdir(output_dir) if f.endswith(".json")]
    print(f"Bắt đầu gộp {len(files)} file từ thư mục {output_dir}...")

    for fname in files:
        file_path = os.path.join(output_dir, fname)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
                if content: # Chỉ thêm nếu có dữ liệu (bỏ qua [] của video private)
                    final_dataset.extend(content)
        except Exception as e:
            print(f"Lỗi khi đọc file {fname}: {e}")

    output_file = "dataset.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_dataset, f, ensure_ascii=False, indent=2)

    print(f"Thành công! Đã tạo file {output_file} với {len(final_dataset)} dòng dữ liệu.")

if __name__ == "__main__":
    merge_transcripts()
