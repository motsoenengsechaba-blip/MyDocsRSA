package com.documentverification.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentValidationService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**


     * Checks a newly uploaded MyDocs RSA document before it is stored, including file presence, size and allowed file type/content rules.


     */


    public void validateUpload(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException(
                    "Document file is required"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException(
                    "File size must not exceed 10 MB"
            );
        }

        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null
                || originalFileName.isBlank()) {

            throw new RuntimeException(
                    "Invalid file name"
            );
        }

        String extension =
                getExtension(originalFileName);

        if (!extension.equals("pdf")
                && !extension.equals("jpg")
                && !extension.equals("jpeg")
                && !extension.equals("png")) {

            throw new RuntimeException(
                    "Only PDF, JPG, JPEG and PNG files are allowed"
            );
        }

        validateFileContent(file, extension);
    }

    /**


     * Checks a document already saved on disk to make sure the stored file still satisfies the backend validation rules.


     */


    public void validateStoredFile(String filePath) {

        if (filePath == null || filePath.isBlank()) {
            throw new RuntimeException(
                    "Document file path is missing"
            );
        }

        Path path = Paths.get(filePath)
                .toAbsolutePath()
                .normalize();

        if (!Files.exists(path)) {
            throw new RuntimeException(
                    "Document file does not exist"
            );
        }

        if (!Files.isRegularFile(path)) {
            throw new RuntimeException(
                    "Document path is not a valid file"
            );
        }

        if (!Files.isReadable(path)) {
            throw new RuntimeException(
                    "Document file cannot be read"
            );
        }

        try {

            if (Files.size(path) == 0) {
                throw new RuntimeException(
                        "Document file is empty"
                );
            }

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not check document file",
                    e
            );
        }
    }

    @SuppressWarnings("ConvertToStringSwitch")
    /**

     * Performs the content-level checks used to reject files that do not match the expected document format.

     */

    private void validateFileContent(
            MultipartFile file,
            String extension) {

        try (InputStream inputStream =
                     file.getInputStream()) {

            byte[] header = new byte[8];

            int bytesRead =
                    inputStream.read(header);

            if (bytesRead < 3) {
                throw new RuntimeException(
                        "Document file is too small or invalid"
                );
            }

            boolean valid = false;

            if (extension.equals("pdf")) {

                String pdfHeader =
                        new String(
                                header,
                                0,
                                Math.min(bytesRead, 5)
                        );

                valid = pdfHeader.equals("%PDF-");

            } else if (extension.equals("png")) {

                if (bytesRead >= 8) {

                    valid =
                            (header[0] & 0xFF) == 0x89
                            && (header[1] & 0xFF) == 0x50
                            && (header[2] & 0xFF) == 0x4E
                            && (header[3] & 0xFF) == 0x47
                            && (header[4] & 0xFF) == 0x0D
                            && (header[5] & 0xFF) == 0x0A
                            && (header[6] & 0xFF) == 0x1A
                            && (header[7] & 0xFF) == 0x0A;
                }

            } else if (extension.equals("jpg")
                    || extension.equals("jpeg")) {

                valid =
                        (header[0] & 0xFF) == 0xFF
                        && (header[1] & 0xFF) == 0xD8
                        && (header[2] & 0xFF) == 0xFF;
            }

            if (!valid) {

                throw new RuntimeException(
                        "File content does not match its file extension"
                );
            }

        } catch (IOException e) {

            throw new RuntimeException(
                    "Could not validate document file",
                    e
            );
        }
    }

    /**


     * Extracts the file extension used by the MyDocs RSA upload validation rules.


     */


    private String getExtension(String fileName) {

        int dotIndex =
                fileName.lastIndexOf(".");

        if (dotIndex <= 0
                || dotIndex >= fileName.length() - 1) {

            return "";
        }

        return fileName
                .substring(dotIndex + 1)
                .toLowerCase();
    }
}