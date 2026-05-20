import json

def lihat_struktur():
    try:
        # Membaca file geojson Anda
        with open('pertanian.geojson', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        fitur = data.get('features', [])
        
        if len(fitur) > 0:
            print("=== STRUKTUR ASLI BARIS PERTAMA ===")
            print(json.dumps(fitur[0], indent=4))
            print("===================================")
        else:
            print("File GeoJSON tidak memiliki array 'features'.")
            
    except Exception as e:
        print("Terjadi kesalahan saat membaca file:", e)

if __name__ == "__main__":
    lihat_struktur()