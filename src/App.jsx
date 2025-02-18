import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import "./App.css";
import.meta.env.VITE_BASE_URL;
import.meta.env.VITE_API_PATH;
import { Modal } from "bootstrap";

const API_BASE = import.meta.env.VITE_BASE_URL;

// 請自行替換 API_PATH
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);

  const productModalRef = useRef(null);
  const modalMethodRef = useRef(null);
  const confirmModalRef = useRef(null);

  const defaultModalState = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    imagesUrl: [],
    is_enabled: false,
  };

  const [tempProduct, setTempProduct] = useState(defaultModalState);
  const [modalMode, setModalMode] = useState(null);
  const [currentProductId, setCurrentProductId] = useState("");

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common["Authorization"] = token;
    checkIsLogin();

    modalMethodRef.current = new Modal(productModalRef.current, {
      backdrop: false,
    });

    confirmModalRef.current = new Modal(confirmModalRef.current, {
      backdrop: false,
    });
  }, []);

  /** 刪除確認 */
  function confirmDelete(id) {
    setCurrentProductId(id);
    confirmModalRef.current.show();
  }

  /** 取消刪除 */
  function cancelDelete() {
    confirmModalRef.current.hide();
  }

  /** 刪除產品 */
  async function deleteProduct() {
    try {
      await axios.delete(
        `${API_BASE}/v2/api/${API_PATH}/admin/product/${currentProductId}`
      );
      alert("產品刪除成功");
      cancelDelete();
      getProducts();
    } catch {
      alert("產品刪除失敗");
    }
  }

  /** 新增、編輯產品 */
  async function updateProduct() {
    if (modalMode === "add") {
      try {
        await axios.post(`${API_BASE}/v2/api/${API_PATH}/admin/product`, {
          data: {
            ...tempProduct,
            origin_price: Number(tempProduct.origin_price),
            price: Number(tempProduct.price),
            is_enabled: !tempProduct.is_enabled ? 0 : 1,
          },
        });
        alert("產品新增成功");
        closeModal();
        getProducts();
      } catch {
        alert("產品新增失敗");
      }
    } else {
      try {
        await axios.put(
          `${API_BASE}/v2/api/${API_PATH}/admin/product/${currentProductId}`,
          {
            data: {
              ...tempProduct,
              origin_price: Number(tempProduct.origin_price),
              price: Number(tempProduct.price),
              is_enabled: !tempProduct.is_enabled ? 0 : 1,
            },
          }
        );
        alert("編輯產品成功");
        closeModal();
        getProducts();
      } catch {
        alert("編輯產品失敗");
      }
    }
  }

  function addImage() {
    const copiedImages = [...tempProduct.imagesUrl];
    copiedImages.push("");
    setTempProduct({
      ...tempProduct,
      imagesUrl: copiedImages,
    });
  }

  function removeImage() {
    const copiedImages = [...tempProduct.imagesUrl];
    copiedImages.pop();
    setTempProduct({
      ...tempProduct,
      imagesUrl: copiedImages,
    });
  }

  function handleSubImage(event, index) {
    const { value } = event.target;
    const copiedImages = [...tempProduct.imagesUrl];
    copiedImages[index] = value;
    setTempProduct({
      ...tempProduct,
      imagesUrl: copiedImages,
    });
  }

  function openModal(mode, product) {
    setModalMode(mode);
    switch (mode) {
      case "add":
        setTempProduct(defaultModalState);
        break;
      case "edit":
        setTempProduct(product);
        setCurrentProductId(product.id);
        break;
    }
    modalMethodRef.current.show();
  }

  function closeModal() {
    modalMethodRef.current.hide();
  }

  function handleModalInput(event) {
    const { value, name, checked, type } = event.target;

    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  /** 檢查使用者登入狀態 */
  async function checkIsLogin() {
    try {
      const res = await axios.post(`${API_BASE}/v2/api/user/check`);
      const { success } = res.data;
      setIsAuth(success);
      if (!success) {
        alert("請先登入");
      } else {
        getProducts();
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  /** 取得產品列表 */
  async function getProducts() {
    try {
      const res = await axios.get(
        `${API_BASE}/v2/api/${API_PATH}/admin/products`
      );
      const { products } = res.data;
      setProducts(products);
    } catch (error) {
      console.log("products error", error);
    }
  }

  function handleInput(event) {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function login() {
    event.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/v2/admin/signin`, formData);
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)};`;
      axios.defaults.headers.common["Authorization"] = token;
      setIsAuth(true);
      getProducts();
    } catch (error) {
      setIsAuth(false);
      alert("登入失敗");
      console.log("login error", error);
    }
  }

  return (
    <>
      {isAuth ? (
        <div className="container">
          <div className="row mt-5">
            <div className="col">
              <div className="d-flex justify-content-between">
                <h2>產品列表</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal("add")}
                >
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>產品名稱</th>
                    <th>原價</th>
                    <th>售價</th>
                    <th>是否啟用</th>
                    <th>查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products && products.length > 0 ? (
                    products.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.origin_price}</td>
                        <td>{item.price}</td>
                        <td>{item.is_enabled ? "啟用" : "未啟用"}</td>
                        <td>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              openModal("edit", item);
                            }}
                          >
                            編輯
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                              confirmDelete(item.id);
                            }}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">尚無產品資料</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form className="d-flex flex-column gap-3" onSubmit={login}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="username"
                placeholder="name@example.com"
                name="username"
                onChange={(event) => {
                  handleInput(event);
                }}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                placeholder="Password"
                onChange={(event) => {
                  handleInput(event);
                }}
              />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        ref={productModalRef}
        className="modal"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">
                {modalMode === "add" ? "新增" : "編輯"}產品
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => {
                  closeModal();
                }}
              ></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={tempProduct.imageUrl}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                        onChange={(event) => {
                          handleModalInput(event);
                        }}
                      />
                    </div>
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                          value={image}
                          onChange={(e) => {
                            handleSubImage(e, index);
                          }}
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}
                    <div className="btn-group w-100">
                      {tempProduct.imagesUrl.length < 5 &&
                        tempProduct.imagesUrl[length - 1] != "" && (
                          <button
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={addImage}
                          >
                            新增圖片
                          </button>
                        )}
                      {tempProduct.imagesUrl.length > 1 && (
                        <button
                          className="btn btn-outline-danger btn-sm w-100"
                          onClick={removeImage}
                        >
                          取消圖片
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      value={tempProduct.title}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      value={tempProduct.category}
                      name="category"
                      id="category"
                      type="text"
                      className="form-control"
                      placeholder="請輸入分類"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={tempProduct.unit}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={tempProduct.origin_price}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                        onChange={(event) => {
                          handleModalInput(event);
                        }}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={tempProduct.price}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                        onChange={(event) => {
                          handleModalInput(event);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={tempProduct.description}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      value={tempProduct.content}
                      name="content"
                      id="content"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入說明內容"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      value={tempProduct.is_enabled}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                      onChange={(event) => {
                        handleModalInput(event);
                      }}
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  closeModal();
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={updateProduct}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="delProductModal"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        ref={confirmModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  cancelDelete();
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  deleteProduct();
                }}
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
