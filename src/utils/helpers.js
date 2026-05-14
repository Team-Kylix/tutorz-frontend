/**
 * Extracts a readable error message from an Axios error object.
 */
export const extractErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred.';
};

/**
 * Formats a date string to a readable format (e.g., DD MMM YYYY).
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Formats currency (e.g., LKR 1,000.00).
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
};

/**
 * Standardizes a time string to a readable 12-hour AM/PM format.
 * Handles: "14:30" -> "2:30 PM", "08:00 AM" -> "8:00 AM", "11:30" -> "11:30 AM"
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  // Clean the input (remove extra spaces)
  const cleanStr = timeStr.trim();
  
  // Try to match HH:mm (optional AM/PM)
  // This regex matches "08:00", "14:30", "08:00 AM", "8:00PM"
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return cleanStr; 

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    // Already has AM/PM, just ensure normalized spacing and removal of leading zero for hours 1-9
    return `${hours}:${minutes} ${ampm}`;
  } else {
    // 24-hour conversion
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${suffix}`;
  }
};

/**
 * Cleans up the class name by removing redundant 'Class -' and 'Grade X -' prefixes.
 * Example: "Class - Science - Grade 7 - Sunday" -> "Science - Sunday"
 */
export const cleanClassName = (className) => {
  if (!className) return '';
  return className
    .split(' - ')
    .filter(p => {
        const lower = p.toLowerCase().trim();
        return !lower.startsWith('class') && !lower.startsWith('grade');
    })
    .join(' - ') || className;
};

/**
 * Compresses an image file if it exceeds the specified maximum size.
 * Uses Canvas API for client-side compression.
 */
export const compressImage = (file, maxSizeKB = 200) => {
  return new Promise((resolve, reject) => {
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};