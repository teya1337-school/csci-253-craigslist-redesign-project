package com.teya1337.craigslist.common.image;

import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;

public final class ImageUpload {
    public static final long MAX_BYTES = 2 * 1024 * 1024;
    public record ValidatedImage(String contentType, byte[] data) {}
    private ImageUpload() {}

    public static ValidatedImage read(MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES) throw invalid("Choose a JPEG or PNG image up to 2 MB.");
        try {
            byte[] data = file.getBytes();
            if (data.length > MAX_BYTES) throw invalid("Choose an image up to 2 MB.");
            try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(data))) {
                var readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw invalid("Choose a valid JPEG or PNG image.");
                var reader = readers.next();
                try {
                    String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    if (!format.equals("jpeg") && !format.equals("png")) throw invalid("Choose a JPEG or PNG image.");
                    reader.setInput(input);
                    int width = reader.getWidth(0), height = reader.getHeight(0);
                    if (width < 1 || height < 1 || width > 4096 || height > 4096) {
                        throw invalid("Choose an image no larger than 4096 × 4096 pixels.");
                    }
                    if (reader.read(0) == null) throw invalid("Choose a valid JPEG or PNG image.");
                    return new ValidatedImage(format.equals("png") ? "image/png" : "image/jpeg", data);
                } finally { reader.dispose(); }
            }
        } catch (IOException | IllegalArgumentException exception) {
            throw invalid("We could not read that image. Choose a valid JPEG or PNG.");
        }
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
