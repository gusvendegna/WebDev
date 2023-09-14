library(emmeans)

y <- c(0,1,4,9)
y_pred <- c(0.1,0.9,3.5,10)

#Mean Absolute Error
MAE <- function(y, y_pred) {
  return(mean(abs(y-y_pred)))
}

MAE(y, y_pred)

#Mean Squared Error
MSE <- function(y, y_pred) {
  return(mean((y-y_pred)^2))
}

MSE(y, y_pred)

# Root Mean Squared Error
RMSE <- function(y, y_pred) {
  return(sqrt(MSE(y, y_pred)))
}

RMSE(y, y_pred)

#R square of actual vs predicted
RSQ <- function(y, y_pred) {
  return(1-sum((y-y_pred)^2)/sum((y-mean(y))^2))
}

RSQ(y, y_pred)

expected <- c(0,1,4,9)
predicted <- c(0.1,0.9,3.5,10)

#F1 score for binary or multi-class classification. https://stackoverflow.com/questions/8499361/easy-way-of-counting-precision-recall-and-f1-score-in-r
f1_score <- function(expected, predicted, positive.class="1") {
  predicted <- factor(as.character(predicted), levels=unique(as.character(expected)))
  expected  <- as.factor(expected)
  cm = as.matrix(table(expected, predicted))
  
  precision <- diag(cm) / colSums(cm)
  recall <- diag(cm) / rowSums(cm)
  f1 <-  ifelse(precision + recall == 0, 0, 2 * precision * recall / (precision + recall))
  
  #Assuming that F1 is zero when it's not possible compute it
  f1[is.na(f1)] <- 0
  
  #Binary F1 or Multi-class macro-averaged F1
  ifelse(nlevels(expected) == 2, f1[positive.class], mean(f1))
}

f1_score(expected, predicted)

#recall on a 3-class classification
RECALL <- function(expected, predicted) {
  predicted <- factor(as.character(predicted), levels=sort(unique(as.character(expected))))
  expected  <- as.factor(expected)
  expected <- factor(expected, level=sort(levels(expected)))
  
  #predicted <- factor(pred[,'T_on_time_late_early'], levels=sort(unique(as.character(y[,'T_on_time_late_early'])))) 
  #expected <- as.factor(y[,'T_on_time_late_early'])
  
  cm = as.matrix(table(expected, predicted))
  recall <- diag(cm) / rowSums(cm)
  
  recall <- replace(recall, is.na(recall), 0)
  recall <- replace(recall, is.infinite(recall), 0)
  
  
  return(sum(recall))
}

RECALL(expected, predicted)
