import * as THREE from 'three';

let particles: { time: number; factor: number; speed: number; vec: THREE.Vector3 }[] = [];
let isReady = false;
const dummy = new THREE.Object3D();

// Worker context for Next.js
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    const { count } = payload;
    particles = [];
    for (let i = 0; i < count; i++) {
        const time = Math.random() * 100;
        const factor = 0.5 + Math.random() * 1.5;
        const speed = 0.005 + Math.random() / 200;
        
        // Quỹ đạo hình cầu xung quanh tâm
        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;
        const z = Math.random() * 2 - 1;
        const vec = new THREE.Vector3(x, y, z).normalize().multiplyScalar(2.0 + Math.random() * 2.5);
        
        particles.push({ time, factor, speed, vec });
    }
    isReady = true;
    
    // Khởi tạo buffer đầu tiên và gửi lại Main Thread
    const initialBuffer = new ArrayBuffer(count * 16 * 4); // 16 floats (ma trận 4x4) * 4 bytes/float
    (self as unknown as Worker).postMessage({ type: 'INIT_DONE', buffer: initialBuffer }, [initialBuffer]);
  }

  if (type === 'TICK' && isReady) {
    const { buffer, era, entropy = 0, stabilityIndex = 1 } = payload;
    
    // Lấy view trên buffer nhận được từ Main Thread
    const view = new Float32Array(buffer);
    
    // Hệ số hỗn loạn dựa trên Entropy
    const chaos = Math.pow(entropy, 1.5) * 2.5;
    // Hệ số tập trung dựa trên Stability
    const gravity = Math.max(0.2, stabilityIndex);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Tốc độ hạt tăng lên khi Entropy cao
      const speedMult = 1.0 + entropy * 2.0;
      const t = (p.time += p.speed * speedMult);

      // Quỹ đạo cơ bản bị ảnh hưởng bởi trọng lực (Stability)
      const currentRadius = p.vec.length() * (0.8 + (1.0 - gravity) * 0.5);
      const basePos = p.vec.clone().normalize().multiplyScalar(currentRadius);

      // Chuyển động nhiễu hỗn loạn (Chaos/Entropy Simulator)
      dummy.position.set(
        basePos.x + Math.cos(t * p.factor + i) * (0.1 + chaos),
        basePos.y + Math.sin(t * p.factor + i) * (0.1 + chaos),
        basePos.z + Math.cos(t * p.factor + i) * (0.1 + chaos)
      );

      // Góc xoay phụ thuộc vào kỷ nguyên và áp lực
      if (era === 'cyberpunk') {
        dummy.rotation.set(t * (2 + entropy), t * (2 + entropy), t * (2 + entropy));
      } else {
        dummy.lookAt(0, 0, 0);
      }

      // Kích thước hạt co giãn nhẹ theo nhịp đập
      const pulseScale = 1.0 + Math.sin(t * 2) * 0.1 * entropy;
      const baseSize = era === 'paleolithic' ? 0.06 : era === 'medieval' ? 0.04 : 0.03;
      const size = baseSize * pulseScale;
      dummy.scale.set(size, size, size);

      dummy.updateMatrix();

      // Nạp mảng số float của matrix (16 phần tử) trực tiếp vào buffer tại vị trí của particle i
      dummy.matrix.toArray(view, i * 16);
    }

    // Gửi trả buffer đã được tính toán xong về lại Main Thread.
    // Dùng Transferable Object (tham số 2: [view.buffer]) để cắt dứt hoàn toàn chi phí Copy Data.
    (self as unknown as Worker).postMessage({ type: 'TICK_DONE', buffer: view.buffer }, [view.buffer]);
  }
};
