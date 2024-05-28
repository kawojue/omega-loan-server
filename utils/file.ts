import { StatusCodes } from "enums/statusCodes"

export const validateFile = (
    file: Express.Multer.File,
    maxSize: number, ...extensions: string[]
) => {
    if (maxSize < file.size) {
        return {
            status: StatusCodes.PayloadTooLarge,
            message: `${file.originalname} is too large`
        }
    }

    if (!extensions.includes(file.originalname.split('.').pop())) {
        return {
            status: StatusCodes.UnsupportedContent,
            message: `${file.originalname} extension is not allowed`,
        }
    }

    return { file }
}