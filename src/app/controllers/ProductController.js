import { Op } from 'sequelize';
import * as Yup from 'yup';

import Product from '../models/Product';

class ProductController {
  async create(request, response) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      value: Yup.number().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({
        error: error.errors ? error.errors.join('. ') : 'Validation fails.',
      });
    }

    const { description, value } = request.body;
    const product = await Product.create({
      description,
      value,
    });

    return response.json(product);
  }

  async index(request, response) {
    const { page = 1, q } = request.query;
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']],
      where: q
        ? {
            description: { [Op.iLike]: `${q}%` },
          }
        : {},
      limit: 20,
      offset: (page - 1) * 20,
    });

    const lastRecord = (
      await Product.findAll({
        order: [['createdAt', 'ASC']],
        limit: 1,
      })
    )[0];

    const next = products[0]
      ? !(products[products.length - 1].id === lastRecord.id)
      : null;

    return response.json({
      products,
      next: next ? `${process.env.API_URL}/products?page=${page + 1}` : null,
      previous: page > 1,
    });
  }

  async update(request, response) {
    const { id } = request.params;
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      value: Yup.number().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return response.status(400).json({
        error: error.errors ? error.errors.join('. ') : 'Validation fails.',
      });
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return response.status(400).json({ error: 'Invalid UUID' });
    }

    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return response.status(404).json({ error: 'Product not found' });
    }

    const { description, value } = request.body;

    await product.update({ description, value });

    return response.json(product);
  }

  async delete(request, response) {
    const { id } = request.params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      )
    ) {
      return response.status(400).json({ error: 'Invalid UUID' });
    }

    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return response.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();

    return response.status(204).send();
  }
}

export default new ProductController();
