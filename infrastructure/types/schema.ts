export interface Photo {
  id: string; // Unique photo ID
  src: string; // S3 URL
  alt?: string; // Optional alt text
}

export interface Album {
  id: string; // Unique album ID
  title: string; // Album title
  description?: string; // Optional longer description
  cover: Photo; // Cover photo
  photos?: Photo[]; // Optional list of photo objects
}
