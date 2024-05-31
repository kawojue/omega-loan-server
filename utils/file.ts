import { StatusCodes } from "enums/statusCodes"

export const validateFile = (file: Express.Multer.File) => {
    const MAX_SIZE = 5 << 20
    const extensions = ['jpeg', 'png', 'jpg']

    if (MAX_SIZE < file.size) {
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