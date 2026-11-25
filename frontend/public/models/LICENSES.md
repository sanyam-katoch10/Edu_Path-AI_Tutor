# EduPath 3D Asset Licenses & Verification Audit

All 3D models stored under `frontend/public/models/` are sourced from **Poly Haven** under the **CC0 1.0 Universal (Public Domain Dedication)** license. No external hotlinks are used at runtime; every asset is bundled locally as a self-contained, texture-optimized binary glTF 2.0 (`.glb`) file.

- **License:** [CC0 1.0 Universal (Public Domain)](https://creativecommons.org/publicdomain/zero/1.0/)
- **Source Catalog:** [Poly Haven Models](https://polyhaven.com/models)
- **Total Bundled Footprint:** **3.90 MB** across **10 assets** (optimized from 26.81 MB raw 1K sources)

---

## Learning Journey Assets (`models/journey/`)

| Local File | Poly Haven Asset | Author(s) | License | Size | Triangles | Texture Res | Scene Role |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- | :--- |
| `models/journey/cliff_rock.glb` | [Rock 07](https://polyhaven.com/a/rock_07) (`rock_07`) | Jenelle van Heerden | CC0 1.0 | 563.6 KB | 14,844 | 512×512 | Primary floating island cliff/rock formation (instanced across 11 islands) |
| `models/journey/moss_boulder.glb` | [Rock Moss Set 01](https://polyhaven.com/a/rock_moss_set_01) (`rock_moss_set_01`) | Kless Gyzen | CC0 1.0 | 205.6 KB | 5,000 | 512×512 | Moss-covered emerald boulder for island ledges and layered terrain |
| `models/journey/fern.glb` | [Fern 02](https://polyhaven.com/a/fern_02) (`fern_02`) | Rob Tuytel, Rico Cilliers | CC0 1.0 | 92.6 KB | 784 | 512×512 | Forest fern foliage instanced along island rims and waterfall banks |
| `models/journey/shrub.glb` | [Shrub 03](https://polyhaven.com/a/shrub_03) (`shrub_03`) | Rico Cilliers | CC0 1.0 | 342.3 KB | 8,287 | 512×512 | Verdant forest shrub/canopy foliage instanced on islands |
| `models/journey/wooden_bridge.glb` | [Modular Wooden Pier](https://polyhaven.com/a/modular_wooden_pier) (`modular_wooden_pier`) | Rico Cilliers | CC0 1.0 | 630.8 KB | 11,758 | 512×512 | Weathered timber bridge connecting islands along the learning ascent |
| `models/journey/citadel_tower.glb` | [Modular Fort 01](https://polyhaven.com/a/modular_fort_01) (`modular_fort_01`) | Rico Cilliers | CC0 1.0 | 526.6 KB | 4,772 | 512×512 | Stone summit citadel landmark at Stage 11 (Algebraic Synthesis) |

---

## Knowledge Library Assets (`models/library/`)

| Local File | Poly Haven Asset | Author(s) | License | Size | Triangles | Texture Res | Scene Role |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- | :--- |
| `models/library/bookshelf.glb` | [Wooden Bookshelf Worn](https://polyhaven.com/a/wooden_bookshelf_worn) (`wooden_bookshelf_worn`) | Ulan Cabanilla | CC0 1.0 | 404 KB | 10,106 | 512×512 | Tall antique wooden library bookcase framing the gallery walls |
| `models/library/stone_arch.glb` | [Modular Fort 01](https://polyhaven.com/a/modular_fort_01) (`modular_fort_01`) | Rico Cilliers | CC0 1.0 | 381.2 KB | 1,368 | 512×512 | Classical stone architectural archway framing the library hall |
| `models/library/book_volume.glb` | [Book Encyclopedia Set 01](https://polyhaven.com/a/book_encyclopedia_set_01) (`book_encyclopedia_set_01`) | John Malcolm | CC0 1.0 | 302.9 KB | 3,392 | 512×512 | Single dimensional hardcover tome reused across all 6 OpenStax modules with programmatic covers |
| `models/library/lantern.glb` | [Lantern Chandelier 01](https://polyhaven.com/a/lantern_chandelier_01) (`lantern_chandelier_01`) | Kirill Sannikov | CC0 1.0 | 548.6 KB | 5,971 | 512×512 | Antique hanging lantern chandelier anchoring warm golden illumination |

---

## Optimization & Reuse Notes
- Multi-mesh source kits (`rock_moss_set_01`, `fern_02`, `modular_wooden_pier`, `modular_fort_01`, `book_encyclopedia_set_01`) were pruned to extract only the specific required mesh nodes and referenced PBR textures, eliminating unused geometry and texture maps.
- Embedded PBR diffuse, normal, and ARM (AO/Roughness/Metalness) maps were downsampled to 512×512 JPEG for fast loading in student browsers while retaining crisp surface relief.
- `models/library/book_volume.glb` preserves separate `cover` and `paper` material slots so all six OpenStax Algebra 1 knowledge modules share one cached geometry with programmatically generated cover artwork and leather/ivory PBR finishes.
- All approved legacy 3D hero components (`FloatingBook.tsx`, `LearningOrb.tsx`, `GeometricShapes.tsx`, `SceneContainer.tsx`) remain completely unmodified.
