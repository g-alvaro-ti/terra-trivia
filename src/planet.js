// ==========================================================================
// planet.js - Renderização 3D low-poly detalhada da Terra com Three.js
// Compartilha um único contexto WebGL entre #inicio (.terra-slot) e
// #carregamento (.carregamento-terra-slot), pausando quando oculto.
// ==========================================================================

(function () {
    "use strict";

    const MAP_COLS = 288;
    const MAP_ROWS = 144;
    const MAP_RLE =
        "1798O16T6I8O28I231O15T4I6O32I232O14T3I4O36I232O13TI2O40I234O11TO42I98O2T148O40I91O15T145O38I82O29T141O34I77O42T91O11T13O12T4I6O30I73O54T50O7T28O11T14O11T5I6O26I43O2T26O68T40O33T10O4T15O10T6I6O23I39O9T20O81T31O41T2O30T7I6O20I40O14T10O96T20O75T8I7O16I43O30T3M89T16O70T2O4T7I9O14I9O5I3T28O29T3M92T13O70B4O2BI17O10I11O5I3B30O27B3M92B13O71B24O8I50O27B3M89B17O58B13O3B22O4I54O25B3M85B21O58B13O4B4I18O2I56O24B3M82B25O11B4O18B6M18B13O11B73O24B3M81B26O8B12O13B6M18B13O12B46O3B21O26B3M81B27O5B18O10B5M18B13O14B44O3B7OB12O27B3M81B28O2B21O9B6M17B13O15B43O4B6O3B10O27B3M81B53O7B6M17B13O16B38O3BO4B6O7B2O31B3M81B54O7B5M17B13O17B37O3BO5B4O41B3M64B6O11B55O6F5M48F40O5F2O109F13O5F56O5F6M46F41O3F2O111F75O5F5M45F45O112F78O3F5M44F44O113F79O3F6M43F44O8F8M32FO64F79O4F5M41F47O7F8M9F11O5F7O43D21F80O4F5M38F50O13FO10F11O5F5OF44D20F5O3F74O3F6M35F52O6F4O3F2O9F11OM9OF44D19F5O3F75O4F5M33F49O9F7O3F2O8F11O5M5OF44D18F6O3F75O4F5M32F50O3F14O3F19O6F5OF44D17F7O2F76O4F6M30F51O3F15O3F3O2F12O7F5OF44D8F3O5F7O2F77O5F5M29F52O3F34O8F5OF13D25M6D7F5O3F8O2F78O4F5M28F53O3F33O28F25M13F5O3F6O3F80O2FD6M5D22F55OF33O28F25M14F5O2F4O4F82OF2D5M5D21F55O2F34O27F25M14F9O5F84O2D5M5D21F54O3F36O25F25M15F7O4F87O11D20F54O4D37ODO13D9F25M15F7O2F90O10D20F53O35D2O20D9F25M15F99O10D12F4O3F54O35D2O10D2O8D9F25M15F100ODO7D8F8O3F53O49D3O6D9F25M14F102ODO6D6F10O3F52O37D3O11D3O5D6F18S24F104O6D4F12O2F53O37D3O13D4O2D6F18S23F106O5D5F66O38D3O15D7O2F18S23F107O4D5F65O39D4O15D9O17S21F110O8F10O5F50O40D3O16D8O17SO18F113O7F4O3F8O2F48O41D3O14D10O13S5O14F117O6FO6F11O4F42O42D4O12D11O13S6OF11R121O10F57O43D3O11D13O11S7OF11R124O7F57O44D3O9D14O10S9O11R10OR115O6F56O44D3O6D18O9R10O10R9O3R116O7F53O45S3O3S21O7R12O9R9O3R118O5F53O41S4M27O6R13O9R9O3R120O3F8OR45O40S6M6SF19O5R13O9R9O4R121OF6O8R40O40S6M6SF20O3R15O7R10O4R126O13R39O38S6M6S21O2RO2R13O5R12O4R125O15R39O37S6M6S22ORO2R13O4R13O5R124O17R38O36S6M6S24O2R14O3R13O4R125O2R4M12R38O6S4O25S6M6S40O3R10OR131O2R5M12R50O2S16R15S37O2R3O2R8O3R131O2R5M14R49OS16R14S39O2R3OR6O5R131O2R5M15R49O16R13S41O2R8O6R130OF2R5M17R47O16R12S43O2R6O7R2O4R124OF3R4M18RF45O16R10S46O2R5O7R2O4R124OF3R4M18R4F43O15R9S48OR5O7R2O3R125OF3R4M18R6F41O15R9S49OR12O4R7O7R110O2F3R4M18R9F38O15R9S50OR11O4R8O7R109O2F3R5M17R9SF38O14R8S52OR24O7R108OF3R5M17R9S39O22S52O7R20O6R107OF3R5M17R9S39O22S57O2R23O4R107O4R4M17R9S39O22S85O2R106O4R4M17R8S40O22S194O3R4M17R8S40O22S81OS113O2R4M17R8S40O21S7OS64O6S4O2S113OF5M3F20S41O20S7O3S61O8S4O2S114O5M3F20S41O20S6O4S60O11S2O3S115O3M3F20S41O19S7O3S59O18S116O2M3F19S42OS8D10S6O4S57O21S115O2M3F19S43O8D9S7O4S56O19D4S114O2M3F19S43O8D9S7O4S54O21D5S113O2M3F18S44O8D8S8O3S53O2S21D6S112O3M2F17S45O8D8S8O3S53O2F21D6F112O3M18F47O7D8S8O3S53O2F21D7F110O4M17F48O7D7F65O2F21D8F109O4M16F49O7D7F65O2F21D8F109O4M15F51O12F66O2F21D8F109O4M14F52O11F67O2F21D8F109O4M13F54O10F68OF21D7F110O4M12F55O9F69O29F110O4M11F57O7F70O8F7O14F109OF4M10F58O2F92O12F109O2F3M9F155O9F19OF90O2F3M7F158O8F19O3F88O2F3M6F185O3F88O3F3M4F187O2F89O3F3M3F187O2F90O3F3M3F166O2F111O3F3M2F167O2F111O3F3M2F280O4F2MF185OF95O4F2MF281O4F2M282O4F2M282O5F283O5F285O3F287OF2306O6I278O10I274O14I270O18I80O80I106O22I57O110I95O26I43O131I84O30I38O143I9O12I50O36I33O182I17O56I28O274I9O3335I";

    // Paleta de biomas com cores claras e luminosas alinhadas ao design do TerraTrivia
    const PALETTE = {
        OCEAN_DEEP: 0x2682db,
        OCEAN_MID: 0x3ea2ef,
        OCEAN_SHELF: 0x5cc7f7,
        OCEAN_SHALLOW: 0x86e4fc,
        ICE_SEA: 0xdff2fe,
        COAST_SAND: 0xfae8af,
        COAST_GREEN: 0x9de99a,
        I: 0xf7fbff,
        I_EDGE: 0xdbf0fd,
        T: 0xc2e6c8,
        B: 0x73d49b,
        F: 0x8ae88c,
        R: 0x52d97b,
        S: 0xd3eb7c,
        D: 0xfde5a2,
        M_LOW: 0xaad899,
        M_ROCK: 0xc2ced9,
        M_SNOW: 0xf9fcff
    };

    const RAD_TO_DEG = 180 / Math.PI;
    const DEG_TO_RAD = Math.PI / 180;

    // ----------------------------------------------------------------------
    // Decodificação do mapa RLE e campos de distância costeira (BFS)
    // ----------------------------------------------------------------------
    function decodeBiomeMap() {
        const total = MAP_COLS * MAP_ROWS;
        const biomes = new Array(total);
        let idx = 0;
        let num = 0;

        for (let i = 0; i < MAP_RLE.length; i++) {
            const code = MAP_RLE.charCodeAt(i);
            if (code >= 48 && code <= 57) {
                num = num * 10 + (code - 48);
            } else {
                const count = num > 0 ? num : 1;
                const ch = MAP_RLE[i];
                for (let k = 0; k < count && idx < total; k++) {
                    biomes[idx++] = ch;
                }
                num = 0;
            }
        }

        const landDepth = computeBfsDepth(biomes, (b) => b === "O");
        const seaDepth = computeBfsDepth(biomes, (b) => b !== "O");
        return { biomes, landDepth, seaDepth };
    }

    function computeBfsDepth(biomes, isSeed) {
        const total = MAP_COLS * MAP_ROWS;
        const dist = new Uint8Array(total);
        dist.fill(255);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;

        for (let i = 0; i < total; i++) {
            if (isSeed(biomes[i])) {
                dist[i] = 0;
                queue[tail++] = i;
            }
        }

        while (head < tail) {
            const cur = queue[head++];
            const d = dist[cur] + 1;
            const r = (cur / MAP_COLS) | 0;
            const c = cur % MAP_COLS;

            const neighbors = [
                r * MAP_COLS + ((c + 1) % MAP_COLS),
                r * MAP_COLS + ((c - 1 + MAP_COLS) % MAP_COLS)
            ];
            if (r > 0) neighbors.push((r - 1) * MAP_COLS + c);
            if (r < MAP_ROWS - 1) neighbors.push((r + 1) * MAP_COLS + c);

            for (let n = 0; n < neighbors.length; n++) {
                const nb = neighbors[n];
                if (dist[nb] > d) {
                    dist[nb] = d;
                    queue[tail++] = nb;
                }
            }
        }
        return dist;
    }

    // ----------------------------------------------------------------------
    // Ruído determinístico 3D para relevo esculpido e facetas low-poly
    // ----------------------------------------------------------------------
    function hash3(ix, iy, iz) {
        let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }

    function smoothstep(t) {
        return t * t * (3 - 2 * t);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function noise3D(x, y, z) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const iz = Math.floor(z);
        const fx = smoothstep(x - ix);
        const fy = smoothstep(y - iy);
        const fz = smoothstep(z - iz);

        const n000 = hash3(ix, iy, iz);
        const n100 = hash3(ix + 1, iy, iz);
        const n010 = hash3(ix, iy + 1, iz);
        const n110 = hash3(ix + 1, iy + 1, iz);
        const n001 = hash3(ix, iy, iz + 1);
        const n101 = hash3(ix + 1, iy, iz + 1);
        const n011 = hash3(ix, iy + 1, iz + 1);
        const n111 = hash3(ix + 1, iy + 1, iz + 1);

        const nx00 = lerp(n000, n100, fx);
        const nx10 = lerp(n010, n110, fx);
        const nx01 = lerp(n001, n101, fx);
        const nx11 = lerp(n011, n111, fx);

        const nxy0 = lerp(nx00, nx10, fy);
        const nxy1 = lerp(nx01, nx11, fy);
        return lerp(nxy0, nxy1, fz) * 2 - 1;
    }

    function fbm3(x, y, z) {
        return (
            noise3D(x, y, z) * 0.58 +
            noise3D(x * 2.13 + 11.3, y * 2.13 - 5.1, z * 2.13 + 3.7) * 0.28 +
            noise3D(x * 4.31 - 7.2, y * 4.31 + 9.4, z * 4.31 - 2.1) * 0.14
        );
    }

    // ----------------------------------------------------------------------
    // Amostragem de bioma e elevação a partir da direção unitária (nx, ny, nz)
    // ----------------------------------------------------------------------
    function sampleGeo(mapData, nx, ny, nz) {
        const clampedY = Math.max(-1, Math.min(1, ny));
        const lat = Math.asin(clampedY) * RAD_TO_DEG;
        const lon = Math.atan2(nx, nz) * RAD_TO_DEG;

        const cFloat = ((lon + 180) / 360) * MAP_COLS;
        const rFloat = ((90 - lat) / 180) * MAP_ROWS;

        const c = ((Math.floor(cFloat) % MAP_COLS) + MAP_COLS) % MAP_COLS;
        const r = Math.max(0, Math.min(MAP_ROWS - 1, Math.floor(rFloat)));
        const idx = r * MAP_COLS + c;

        const biome = mapData.biomes[idx];
        const lDepth = mapData.landDepth[idx];
        const sDepth = mapData.seaDepth[idx];

        let radius = 1.0;
        if (biome !== "O") {
            const ridge = fbm3(nx * 6.5, ny * 6.5, nz * 6.5);
            const micro = noise3D(nx * 14.0, ny * 14.0, nz * 14.0);

            if (biome === "M") {
                radius = 1.058 + 0.044 * (0.5 + 0.5 * ridge) + 0.022 * Math.abs(micro);
            } else if (biome === "I") {
                radius = 1.032 + 0.018 * Math.min(1, lDepth / 6) + 0.008 * ridge;
            } else {
                const plateau = Math.min(1, lDepth / 8);
                radius = 1.018 + 0.028 * plateau + 0.015 * Math.max(-0.2, ridge);
            }
        }

        return { biome, lDepth, sDepth, lat, radius };
    }

    // ----------------------------------------------------------------------
    // Construção da malha low-poly detalhada da Terra com relevo e biomas
    // ----------------------------------------------------------------------
    function buildEarthMesh(mapData, detail) {
        const geo = new THREE.IcosahedronGeometry(1, detail);
        const pos = geo.attributes.position;
        const vertexCount = pos.count;

        const vertSamples = new Array(vertexCount);
        const dir = new THREE.Vector3();

        for (let i = 0; i < vertexCount; i++) {
            dir.fromBufferAttribute(pos, i).normalize();
            const sample = sampleGeo(mapData, dir.x, dir.y, dir.z);
            vertSamples[i] = sample;

            pos.setXYZ(
                i,
                dir.x * sample.radius,
                dir.y * sample.radius,
                dir.z * sample.radius
            );
        }

        geo.computeVertexNormals();

        const colors = new Float32Array(vertexCount * 3);
        const tmpColor = new THREE.Color();

        for (let i = 0; i < vertexCount; i += 3) {
            const s0 = vertSamples[i];
            const s1 = vertSamples[i + 1];
            const s2 = vertSamples[i + 2];

            const landCount =
                (s0.biome !== "O" ? 1 : 0) +
                (s1.biome !== "O" ? 1 : 0) +
                (s2.biome !== "O" ? 1 : 0);

            const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
            const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
            const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
            const cLen = Math.hypot(cx, cy, cz) || 1;
            const cSample = sampleGeo(mapData, cx / cLen, cy / cLen, cz / cLen);

            const avgRadius = (s0.radius + s1.radius + s2.radius) / 3;
            const faceHash = hash3((i * 7) | 0, (cy * 100) | 0, (cx * 100) | 0);
            let hex = PALETTE.OCEAN_DEEP;

            if (landCount === 0) {
                const minSea = Math.min(s0.sDepth, s1.sDepth, s2.sDepth, cSample.sDepth);
                if (Math.abs(cSample.lat) > 73 && faceHash > 0.42) {
                    hex = PALETTE.ICE_SEA;
                } else if (minSea <= 2) {
                    hex = PALETTE.OCEAN_SHALLOW;
                } else if (minSea <= 4) {
                    hex = PALETTE.OCEAN_SHELF;
                } else if (minSea <= 7) {
                    hex = PALETTE.OCEAN_MID;
                } else {
                    hex = PALETTE.OCEAN_DEEP;
                }
            } else if (landCount < 3) {
                const landSample = s0.biome !== "O" ? s0 : (s1.biome !== "O" ? s1 : s2);
                if (landSample.biome === "I" || Math.abs(landSample.lat) > 64) {
                    hex = PALETTE.I_EDGE;
                } else if (
                    landSample.biome === "D" ||
                    landSample.biome === "S" ||
                    landSample.biome === "R" ||
                    Math.abs(landSample.lat) < 34
                ) {
                    hex = PALETTE.COAST_SAND;
                } else {
                    hex = PALETTE.COAST_GREEN;
                }
            } else {
                let faceBiome = cSample.biome;
                if (faceBiome === "O") {
                    faceBiome = s0.biome !== "O" ? s0.biome : (s1.biome !== "O" ? s1.biome : s2.biome);
                }
                if (s0.biome === "M" || s1.biome === "M" || s2.biome === "M") {
                    if (avgRadius >= 1.055) faceBiome = "M";
                }

                if (faceBiome === "M") {
                    if (avgRadius >= 1.084) {
                        hex = PALETTE.M_SNOW;
                    } else if (avgRadius >= 1.056) {
                        hex = PALETTE.M_ROCK;
                    } else {
                        hex = PALETTE.M_LOW;
                    }
                } else if (faceBiome === "I") {
                    hex = avgRadius < 1.038 && faceHash > 0.52 ? PALETTE.I_EDGE : PALETTE.I;
                } else {
                    hex = PALETTE[faceBiome] || PALETTE.F;
                }
            }

            tmpColor.setHex(hex);
            // Variação sutil por faceta para evidenciar cada triângulo mesmo em alta densidade
            const shadeDelta = (faceHash - 0.5) * (landCount === 0 ? 0.036 : 0.052);
            tmpColor.offsetHSL(0, 0, shadeDelta);
            tmpColor.convertSRGBToLinear();

            for (let v = 0; v < 3; v++) {
                const base = (i + v) * 3;
                colors[base] = tmpColor.r;
                colors[base + 1] = tmpColor.g;
                colors[base + 2] = tmpColor.b;
            }
        }

        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: true,
            roughness: 0.84,
            metalness: 0.03
        });

        const mesh = new THREE.Mesh(geo, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    // ----------------------------------------------------------------------
    // Nuvens low-poly com sombreamento em azul-celeste para contraste sobre #fff
    // ----------------------------------------------------------------------
    function mergeColoredGeometries(geometries) {
        let totalVerts = 0;
        for (let i = 0; i < geometries.length; i++) {
            totalVerts += geometries[i].attributes.position.count;
        }

        const positions = new Float32Array(totalVerts * 3);
        const normals = new Float32Array(totalVerts * 3);
        const colors = new Float32Array(totalVerts * 3);
        let offset = 0;

        for (let i = 0; i < geometries.length; i++) {
            const g = geometries[i];
            const pos = g.attributes.position.array;
            const norm = g.attributes.normal.array;
            const col = g.attributes.color.array;
            positions.set(pos, offset);
            normals.set(norm, offset);
            colors.set(col, offset);
            offset += pos.length;
            g.dispose();
        }

        const merged = new THREE.BufferGeometry();
        merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
        merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        return merged;
    }

    function buildCloudLayer(seedOffset, clusterCount, baseRadius) {
        const geometries = [];
        const clusterNormal = new THREE.Vector3();
        const refUp = new THREE.Vector3();
        const rawU = new THREE.Vector3();
        const rawV = new THREE.Vector3();
        const tangentU = new THREE.Vector3();
        const tangentV = new THREE.Vector3();
        const puffNormal = new THREE.Vector3();
        const puffU = new THREE.Vector3();
        const puffV = new THREE.Vector3();
        const basis = new THREE.Matrix4();
        const scaleVec = new THREE.Vector3();
        const puffPos = new THREE.Vector3();

        const topColor = new THREE.Color(0xf3f9ff).convertSRGBToLinear();
        const midColor = new THREE.Color(0xd2e7f9).convertSRGBToLinear();
        const baseColor = new THREE.Color(0xa2c6e6).convertSRGBToLinear();
        const faceColor = new THREE.Color();

        for (let c = 0; c < clusterCount; c++) {
            const h1 = hash3(c + seedOffset, 17, 53);
            const h2 = hash3(c + seedOffset, 89, 131);
            const h3 = hash3(c + seedOffset, 211, 19);
            const h4 = hash3(c + seedOffset, 307, 71);
            const h5 = hash3(c + seedOffset, 419, 97);

            const lon = (c / clusterCount) * Math.PI * 2 + (h1 - 0.5) * 0.45;
            const lat = (h2 * 2 - 1) * 64 * DEG_TO_RAD;
            const alt = baseRadius + h3 * 0.024;

            clusterNormal.set(
                Math.cos(lat) * Math.sin(lon),
                Math.sin(lat),
                Math.cos(lat) * Math.cos(lon)
            ).normalize();

            refUp.set(
                0,
                Math.abs(clusterNormal.y) > 0.9 ? 0 : 1,
                Math.abs(clusterNormal.y) > 0.9 ? 1 : 0
            );
            rawU.crossVectors(refUp, clusterNormal).normalize();
            rawV.crossVectors(clusterNormal, rawU).normalize();

            // Rotaciona a orientação local da nuvem para variar direção dos ventos/bandas
            const yaw = h4 * Math.PI * 2;
            const cosY = Math.cos(yaw);
            const sinY = Math.sin(yaw);
            tangentU.copy(rawU).multiplyScalar(cosY).addScaledVector(rawV, sinY).normalize();
            tangentV.copy(rawV).multiplyScalar(cosY).addScaledVector(rawU, -sinY).normalize();

            // 4 arquétipos distintos: pequena, média, faixa alongada e sistema amplo
            let archetype;
            if (h5 < 0.28) {
                archetype = "small";
            } else if (h5 < 0.56) {
                archetype = "medium";
            } else if (h5 < 0.82) {
                archetype = "streak";
            } else {
                archetype = "broad";
            }

            let puffs;
            let spanU;
            let spanV;
            let basePuffMin;
            let basePuffSpan;
            let stretchU;
            let stretchV;
            let thicknessScale;

            if (archetype === "small") {
                puffs = 3 + ((c + seedOffset) % 2);
                spanU = 0.045 + h1 * 0.025;
                spanV = 0.032 + h2 * 0.02;
                basePuffMin = 0.024;
                basePuffSpan = 0.022;
                stretchU = 1.05 + h3 * 0.35;
                stretchV = 0.9 + h4 * 0.3;
                thicknessScale = 0.48 + h1 * 0.14;
            } else if (archetype === "medium") {
                puffs = 5 + ((c + seedOffset) % 3);
                spanU = 0.095 + h1 * 0.045;
                spanV = 0.065 + h2 * 0.035;
                basePuffMin = 0.034;
                basePuffSpan = 0.036;
                stretchU = 1.2 + h3 * 0.45;
                stretchV = 0.95 + h4 * 0.35;
                thicknessScale = 0.5 + h2 * 0.16;
            } else if (archetype === "streak") {
                // Faixas alongadas de frente fria / corrente de vento
                puffs = 7 + ((c + seedOffset) % 4);
                spanU = 0.22 + h1 * 0.11;
                spanV = 0.055 + h2 * 0.03;
                basePuffMin = 0.026;
                basePuffSpan = 0.038;
                stretchU = 1.55 + h3 * 0.65;
                stretchV = 0.85 + h4 * 0.3;
                thicknessScale = 0.4 + h1 * 0.14;
            } else {
                // Grande formação cumulus / tempestade com glóbulos principais e fiapos laterais
                puffs = 8 + ((c + seedOffset) % 4);
                spanU = 0.17 + h1 * 0.08;
                spanV = 0.13 + h2 * 0.06;
                basePuffMin = 0.032;
                basePuffSpan = 0.054;
                stretchU = 1.3 + h3 * 0.5;
                stretchV = 1.1 + h4 * 0.45;
                thicknessScale = 0.54 + h2 * 0.18;
            }

            for (let p = 0; p < puffs; p++) {
                const ph1 = hash3(c * 11 + p, seedOffset, 7);
                const ph2 = hash3(c * 13 + p, seedOffset, 41);
                const ph3 = hash3(c * 17 + p, seedOffset, 83);

                const tAlong = puffs > 1 ? p / (puffs - 1) - 0.5 : 0;
                // Glóbulos centrais maiores e extremidades menores para silhueta natural
                const centerWeight = 1 - Math.min(1, Math.abs(tAlong) * 1.45);
                const puffRadius =
                    basePuffMin +
                    ph1 * basePuffSpan * (0.55 + 0.65 * centerWeight);

                const g = new THREE.IcosahedronGeometry(puffRadius, 1);
                const gPos = g.attributes.position;
                const gColors = new Float32Array(gPos.count * 3);

                // Coloração por faceta (topo branco-gelo e base azul-celeste suave)
                // para manter contraste visível inclusive contra o fundo branco
                for (let i = 0; i < gPos.count; i += 3) {
                    const avgLocalY =
                        (gPos.getY(i) + gPos.getY(i + 1) + gPos.getY(i + 2)) / (3 * puffRadius);
                    const t = Math.max(0, Math.min(1, (avgLocalY + 0.85) / 1.7));

                    if (t < 0.48) {
                        faceColor.copy(baseColor).lerp(midColor, t / 0.48);
                    } else {
                        faceColor.copy(midColor).lerp(topColor, (t - 0.48) / 0.52);
                    }

                    for (let v = 0; v < 3; v++) {
                        const base = (i + v) * 3;
                        gColors[base] = faceColor.r;
                        gColors[base + 1] = faceColor.g;
                        gColors[base + 2] = faceColor.b;
                    }
                }
                g.setAttribute("color", new THREE.BufferAttribute(gColors, 3));

                const spreadU = tAlong * spanU + (ph2 - 0.5) * (spanU * 0.22);
                const curveArc =
                    archetype === "streak"
                        ? Math.sin(tAlong * Math.PI) * spanV * 0.45
                        : 0;
                const spreadV = (ph3 - 0.5) * spanV + curveArc;
                const radialLift = centerWeight * 0.018 + (ph2 - 0.5) * 0.008;

                // Projeta na esfera para nuvens largas acompanharem a curvatura do planeta
                puffPos
                    .copy(clusterNormal)
                    .addScaledVector(tangentU, spreadU)
                    .addScaledVector(tangentV, spreadV)
                    .normalize()
                    .multiplyScalar(alt + radialLift);

                puffNormal.copy(puffPos).normalize();
                puffU.crossVectors(tangentV, puffNormal).normalize();
                // Mantém base dextra (puffU × puffNormal = puffV) para preservar orientação das faces
                puffV.crossVectors(puffU, puffNormal).normalize();

                basis.makeBasis(puffU, puffNormal, puffV);
                scaleVec.set(
                    stretchU * (0.85 + ph3 * 0.35),
                    thicknessScale * (0.82 + centerWeight * 0.32),
                    stretchV * (0.85 + ph1 * 0.35)
                );
                basis.scale(scaleVec);
                basis.setPosition(puffPos);

                g.applyMatrix4(basis);
                g.computeVertexNormals();
                geometries.push(g);
            }
        }

        const mergedGeo = mergeColoredGeometries(geometries);
        const cloudMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });

        const mesh = new THREE.Mesh(mergedGeo, cloudMat);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        return mesh;
    }

    // ----------------------------------------------------------------------
    // Fallback SVG low-poly caso WebGL ou Three.js não estejam disponíveis
    // ----------------------------------------------------------------------
    function renderFallbackSvg(container) {
        if (!container || container.querySelector(".terra-planet-fallback")) return;
        container.innerHTML = `
            <svg class="terra-planet-fallback" viewBox="0 0 220 220" fill="none" aria-hidden="true">
                <polygon points="110,12 164,28 198,74 206,128 182,178 134,206 78,204 32,172 14,120 26,64 62,26" fill="#3B9DF0"/>
                <polygon points="110,12 164,28 138,68 88,62 62,26" fill="#7BE27F"/>
                <polygon points="62,26 88,62 68,108 32,96 26,64" fill="#52D97B"/>
                <polygon points="138,68 198,74 178,126 132,118 118,88" fill="#FDE5A2"/>
                <polygon points="132,118 178,126 164,166 124,154" fill="#D3EB7C"/>
                <polygon points="68,108 102,118 96,174 64,158 54,126" fill="#52D97B"/>
                <polygon points="134,206 78,204 94,186 128,188" fill="#F7FBFF"/>
                <polygon points="56,52 96,46 112,60 72,66" fill="#D2E7F9"/>
                <polygon points="142,144 186,138 194,154 152,158" fill="#D2E7F9"/>
            </svg>
        `;
    }

    // ----------------------------------------------------------------------
    // Controlador principal: renderiza, alterna entre #inicio e #carregamento
    // e gerencia responsividade, interação por arraste e ciclo de vida
    // ----------------------------------------------------------------------
    function initTerraPlanet() {
        const slotInicio = document.querySelector(".terra-slot");
        const slotCarregamento = document.querySelector(".carregamento-terra-slot");
        const headerEl = document.querySelector("#header");
        const carregamentoEl = document.querySelector("#carregamento");

        if (!slotInicio && !slotCarregamento) return;

        if (typeof THREE === "undefined") {
            renderFallbackSvg(slotInicio);
            renderFallbackSvg(slotCarregamento);
            return;
        }

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: "default"
            });
        } catch (err) {
            renderFallbackSvg(slotInicio);
            renderFallbackSvg(slotCarregamento);
            return;
        }

        const isMobileViewport = () => window.matchMedia("(max-width: 767px)").matches;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const canvas = renderer.domElement;
        canvas.className = "terra-planet-canvas";
        canvas.setAttribute("aria-hidden", "true");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);

        // Iluminação clara com contraste azulado nas sombras de nuvens e montanhas
        const hemiLight = new THREE.HemisphereLight(0xf5faff, 0x73a9d8, 0.76);
        scene.add(hemiLight);

        const sunLight = new THREE.DirectionalLight(0xfffdf6, 0.96);
        sunLight.position.set(4.5, 3.2, 5.2);
        sunLight.castShadow = true;
        const shadowRes = isMobileViewport() ? 512 : 1024;
        sunLight.shadow.mapSize.set(shadowRes, shadowRes);
        sunLight.shadow.camera.near = 2.0;
        sunLight.shadow.camera.far = 12.0;
        sunLight.shadow.camera.left = -1.35;
        sunLight.shadow.camera.right = 1.35;
        sunLight.shadow.camera.top = 1.35;
        sunLight.shadow.camera.bottom = -1.35;
        sunLight.shadow.bias = -0.0012;
        sunLight.shadow.normalBias = 0.025;
        scene.add(sunLight);

        const rimLight = new THREE.DirectionalLight(0x9bd4ff, 0.34);
        rimLight.position.set(-4.2, -1.8, -3.5);
        scene.add(rimLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.14);
        scene.add(ambientLight);

        // Grupo inclinado no eixo axial da Terra
        const tiltGroup = new THREE.Group();
        tiltGroup.rotation.z = 21 * DEG_TO_RAD;
        tiltGroup.rotation.x = 11 * DEG_TO_RAD;
        scene.add(tiltGroup);

        const spinGroup = new THREE.Group();
        // Orienta inicialmente mostrando Américas, Atlântico, África e Europa
        spinGroup.rotation.y = 0.25;
        tiltGroup.add(spinGroup);

        const mapData = decodeBiomeMap();
        const lowMemDevice = navigator.deviceMemory && navigator.deviceMemory <= 2;
        // Em PolyhedronGeometry do Three.js, o total de triângulos é 20 * (detail + 1)^2:
        // detail = 31 gera 20.480 triângulos (e detail = 21 gera 9.680 em dispositivos de baixa memória).
        const earthDetail = lowMemDevice ? 21 : 31;
        const earthMesh = buildEarthMesh(mapData, earthDetail);
        spinGroup.add(earthMesh);

        const cloudsA = buildCloudLayer(10, 13, 1.158);
        const cloudsB = buildCloudLayer(200, 10, 1.192);
        tiltGroup.add(cloudsA);
        tiltGroup.add(cloudsB);

        // Controle de tamanho e enquadramento seguro (sem corte ou overflow)
        let activeSlot = null;
        let rafId = null;
        let lastTime = performance.now();

        // Rotação interativa suave sem impedir rolagem vertical no mobile
        let dragging = false;
        let lastPointerX = 0;
        let spinVelocity = 0;

        canvas.addEventListener("pointerdown", (event) => {
            if (prefersReducedMotion.matches) return;
            dragging = true;
            lastPointerX = event.clientX;
            spinVelocity = 0;
        });

        window.addEventListener("pointermove", (event) => {
            if (!dragging) return;
            const dx = event.clientX - lastPointerX;
            lastPointerX = event.clientX;
            const deltaRot = dx * 0.008;
            spinGroup.rotation.y += deltaRot;
            cloudsA.rotation.y += deltaRot * 0.85;
            cloudsB.rotation.y += deltaRot * 0.85;
            spinVelocity = deltaRot * 28;
        }, { passive: true });

        window.addEventListener("pointerup", () => {
            dragging = false;
        }, { passive: true });

        window.addEventListener("pointercancel", () => {
            dragging = false;
        }, { passive: true });

        function updateSize() {
            if (!activeSlot) return;
            const rect = activeSlot.getBoundingClientRect();
            const width = Math.max(1, Math.floor(rect.width));
            const height = Math.max(1, Math.floor(rect.height));

            const maxDpr = isMobileViewport() ? 1.5 : 2;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
            renderer.setSize(width, height, false);

            const aspect = width / height;
            camera.aspect = aspect;

            const boundingRadius = 1.3;
            const padding = 1.12;
            const vFovRad = camera.fov * DEG_TO_RAD;
            const hHalfTan = aspect * Math.tan(vFovRad * 0.5);
            const hFovHalf = Math.atan(hHalfTan);

            const distV = (boundingRadius * padding) / Math.sin(vFovRad * 0.5);
            const distH = (boundingRadius * padding) / Math.sin(hFovHalf);
            camera.position.set(0, 0, Math.max(distV, distH));
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();

            renderer.render(scene, camera);
        }

        function renderFrame(now) {
            rafId = null;
            if (!activeSlot || document.hidden) return;

            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
            lastTime = now;

            if (!prefersReducedMotion.matches) {
                if (!dragging) {
                    const baseSpeed = activeSlot === slotCarregamento ? 0.34 : 0.21;
                    spinGroup.rotation.y += (baseSpeed + spinVelocity) * dt;
                    spinVelocity *= Math.pow(0.08, dt);
                    if (Math.abs(spinVelocity) < 0.001) spinVelocity = 0;
                }
                cloudsA.rotation.y += 0.27 * dt;
                cloudsB.rotation.y += 0.16 * dt;
            }

            renderer.render(scene, camera);

            if (!prefersReducedMotion.matches) {
                rafId = requestAnimationFrame(renderFrame);
            }
        }

        function startLoop() {
            if (rafId !== null || document.hidden || !activeSlot) return;
            lastTime = performance.now();
            renderer.render(scene, camera);
            if (!prefersReducedMotion.matches) {
                rafId = requestAnimationFrame(renderFrame);
            }
        }

        function stopLoop() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function resolveVisibleSlot() {
            const carregamentoVisivel =
                carregamentoEl && !carregamentoEl.classList.contains("hidden");
            if (carregamentoVisivel && slotCarregamento) {
                return slotCarregamento;
            }

            const headerVisivel =
                headerEl && !headerEl.classList.contains("hidden");
            if (headerVisivel && slotInicio) {
                return slotInicio;
            }

            return null;
        }

        function syncActiveSlot() {
            const targetSlot = resolveVisibleSlot();
            if (targetSlot === activeSlot) {
                if (activeSlot) {
                    updateSize();
                    startLoop();
                }
                return;
            }

            activeSlot = targetSlot;

            if (!activeSlot) {
                stopLoop();
                return;
            }

            if (canvas.parentElement !== activeSlot) {
                activeSlot.innerHTML = "";
                activeSlot.appendChild(canvas);
            }

            requestAnimationFrame(() => {
                updateSize();
                startLoop();
            });
        }

        const observerConfig = { attributes: true, attributeFilter: ["class"] };
        const visibilityObserver = new MutationObserver(syncActiveSlot);
        if (headerEl) visibilityObserver.observe(headerEl, observerConfig);
        if (carregamentoEl) visibilityObserver.observe(carregamentoEl, observerConfig);

        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(() => {
                if (activeSlot) updateSize();
            });
            if (slotInicio) resizeObserver.observe(slotInicio);
            if (slotCarregamento) resizeObserver.observe(slotCarregamento);
        } else {
            window.addEventListener("resize", updateSize, { passive: true });
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopLoop();
            } else if (activeSlot) {
                startLoop();
            }
        });

        prefersReducedMotion.addEventListener("change", () => {
            stopLoop();
            if (activeSlot) startLoop();
        });

        syncActiveSlot();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initTerraPlanet);
    } else {
        initTerraPlanet();
    }
})();
