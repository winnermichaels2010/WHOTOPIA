export const REVIEW_SUBMITTED_EVENT = 'whotopia-review-submitted';

const KEY = 'whotopia-reviewed-user';

export const getReviewedUserId = () => localStorage.getItem(KEY);

export const setReviewedUserId = (userId) => localStorage.setItem(KEY, userId);

export const hasLocalReview = (userId) => !!userId && getReviewedUserId() === userId;

export const dispatchReviewSubmitted = () => {
  window.dispatchEvent(new CustomEvent(REVIEW_SUBMITTED_EVENT));
};
